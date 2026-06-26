-- scripts/ga4_export.sql
-- BigQuery query to extract zero-result and low-result search terms from GA4
-- Run this in BigQuery or wire into the getContentGaps tool via the BigQuery client library.
--
-- Prerequisites:
--   1. GA4 BigQuery export enabled on your property
--   2. Replace YOUR_PROJECT and YOUR_DATASET with your values

SELECT
  search_term,
  COUNT(*) AS total_searches,
  COUNTIF(results_count = 0) AS zero_result_searches,
  COUNTIF(results_count > 0 AND results_count < 3) AS low_result_searches,
  ROUND(COUNTIF(results_count = 0) / COUNT(*) * 100, 1) AS zero_result_pct,
  MIN(event_date) AS first_seen,
  MAX(event_date) AS last_seen

FROM (
  SELECT
    event_date,
    (
      SELECT value.string_value
      FROM UNNEST(event_params)
      WHERE key = 'search_term'
    ) AS search_term,
    (
      SELECT COALESCE(value.int_value, 0)
      FROM UNNEST(event_params)
      WHERE key = 'search_results_count'
    ) AS results_count

  FROM `YOUR_PROJECT.YOUR_DATASET.events_*`
  WHERE
    _TABLE_SUFFIX BETWEEN
      FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)) AND
      FORMAT_DATE('%Y%m%d', CURRENT_DATE())
    AND event_name = 'view_search_results'
)

WHERE search_term IS NOT NULL AND search_term != ''

GROUP BY search_term
HAVING total_searches >= 2

ORDER BY zero_result_searches DESC, total_searches DESC

LIMIT 100;
