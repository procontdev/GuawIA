-- ==========================================================
-- Integración de pg_trgm para búsqueda borrosa de distritos
-- Reparación de loop infinito por scoring de datos genéricos
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION guaw.resolve_delivery_zone_v1(
    p_district TEXT,
    p_address TEXT,
    p_reference TEXT
) RETURNS JSONB AS $$
DECLARE
    v_best_zone_id UUID;
    v_best_zone_name TEXT;
    v_best_fee NUMERIC;
    v_best_eta_min INT;
    v_best_eta_max INT;
    v_best_score INT := 0;
    v_norm_district TEXT;
    v_norm_combined TEXT;
    v_zone RECORD;
    v_keyword TEXT;
    v_current_score INT;
    v_coverage_status TEXT := 'out_of_coverage';
    v_matched_keywords TEXT[] := '{}';
    v_district_sim_score REAL;
BEGIN
    -- Normalización
    v_norm_district := lower(unaccent(coalesce(p_district, '')));
    v_norm_combined := lower(unaccent(trim(coalesce(p_address, '') || ' ' || coalesce(p_reference, ''))));

    FOR v_zone IN 
        SELECT id, zone_name, district, reference_keywords, delivery_fee, eta_min, eta_max 
        FROM guaw.delivery_zones 
        WHERE is_active = true
    LOOP
        v_current_score := 0;
        v_matched_keywords := '{}';

        -- Match de Distrito (hasta +50) utilizando búsqueda borrosa
        v_district_sim_score := similarity(v_norm_district, lower(unaccent(v_zone.district)));
        
        IF v_district_sim_score > 0.6 THEN
            v_current_score := v_current_score + 50;
        END IF;

        -- Match de Keywords (+25 por cada una)
        IF v_zone.reference_keywords IS NOT NULL AND array_length(v_zone.reference_keywords, 1) > 0 THEN
            FOREACH v_keyword IN ARRAY v_zone.reference_keywords
            LOOP
                IF v_norm_combined ~* ('\y' || lower(unaccent(v_keyword)) || '\y') THEN
                    v_current_score := v_current_score + 25;
                    v_matched_keywords := array_append(v_matched_keywords, v_keyword);
                END IF;
            END LOOP;
        ELSE
            -- Si no hay keywords predefinidos en la zona, y el cliente provee una dirección,
            -- asumimos que el distrito entero tiene cobertura genérica (+25 puntos extra).
            IF length(v_norm_combined) > 3 THEN
                v_current_score := v_current_score + 25;
            END IF;
        END IF;

        -- Guardar la mejor zona encontrada
        IF v_current_score > v_best_score THEN
            v_best_score := v_current_score;
            v_best_zone_id := v_zone.id;
            v_best_zone_name := v_zone.zone_name;
            v_best_fee := v_zone.delivery_fee;
            v_best_eta_min := v_zone.eta_min;
            v_best_eta_max := v_zone.eta_max;
        END IF;
    END LOOP;

    -- Si hubo match de distrito (50) pero no de keywords (score = 50),
    -- y el usuario sí proveyó una dirección (lenght > 3), consideramos
    -- que tiene sufieciente info aunque ninguna keyword coincidió.
    -- Esto relaja las reglas exigentes previas para evitar bucles infinitos.
    IF v_best_score = 50 AND length(v_norm_combined) > 3 THEN
         -- Empujar el umbral por encima de 70 para aceptarlo
         v_best_score := 75;
    END IF;

    -- Determinación de status de cobertura
    IF v_best_score >= 70 THEN
        v_coverage_status := 'covered';
    ELSIF v_best_score >= 40 THEN
        v_coverage_status := 'insufficient_data';
    ELSE
        v_coverage_status := 'out_of_coverage';
    END IF;

    RETURN jsonb_build_object(
        'matched', (v_best_score >= 40),
        'zone_id', v_best_zone_id,
        'zone_name', v_best_zone_name,
        'delivery_fee', CASE WHEN v_best_score >= 70 THEN v_best_fee ELSE NULL END,
        'eta_min', v_best_eta_min,
        'eta_max', v_best_eta_max,
        'confidence_score', v_best_score,
        'coverage_status', v_coverage_status,
        'resolution_method', 'scoring_v1_fuzzy',
        'resolution_detail', jsonb_build_object(
            'input_district', p_district,
            'input_combined', p_address || ' ' || p_reference,
            'matched_keywords', v_matched_keywords,
            'fuzzy_similarity', v_district_sim_score
        )
    );
END;
$$ LANGUAGE plpgsql;
