-- Create a PostgreSQL function for searching appointments across related tables
-- This allows efficient search on clients.name, clients.x_number, and departments.name

CREATE OR REPLACE FUNCTION search_appointments(
  search_term TEXT,
  filter_status TEXT DEFAULT NULL,
  filter_date_from TEXT DEFAULT NULL,
  filter_date_to TEXT DEFAULT NULL,
  result_limit INT DEFAULT 50,
  result_offset INT DEFAULT 0
)
RETURNS TABLE (
  id INT,
  client_id INT,
  department_id INT,
  appointment_date DATE,
  slot_number INT,
  slot_start_time TIME,
  slot_end_time TIME,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  client_name TEXT,
  client_x_number TEXT,
  client_phone TEXT,
  client_category TEXT,
  department_name TEXT,
  total_count BIGINT
) AS $$
DECLARE
  total_records BIGINT;
BEGIN
  -- First get the total count for pagination
  SELECT COUNT(*)
  INTO total_records
  FROM appointments a
  INNER JOIN clients c ON a.client_id = c.id
  INNER JOIN departments d ON a.department_id = d.id
  WHERE 
    (search_term IS NULL OR search_term = '' OR
     c.name ILIKE '%' || search_term || '%' OR
     c.x_number ILIKE '%' || search_term || '%' OR
     d.name ILIKE '%' || search_term || '%')
    AND (filter_status IS NULL OR filter_status = 'all' OR a.status = filter_status)
    AND (filter_date_from IS NULL OR a.appointment_date >= filter_date_from::DATE)
    AND (filter_date_to IS NULL OR a.appointment_date <= filter_date_to::DATE);

  -- Return the results with the total count
  RETURN QUERY
  SELECT 
    a.id,
    a.client_id,
    a.department_id,
    a.appointment_date,
    a.slot_number,
    a.slot_start_time,
    a.slot_end_time,
    a.status,
    a.notes,
    a.created_at,
    c.name AS client_name,
    c.x_number AS client_x_number,
    c.phone AS client_phone,
    c.category AS client_category,
    d.name AS department_name,
    total_records AS total_count
  FROM appointments a
  INNER JOIN clients c ON a.client_id = c.id
  INNER JOIN departments d ON a.department_id = d.id
  WHERE 
    (search_term IS NULL OR search_term = '' OR
     c.name ILIKE '%' || search_term || '%' OR
     c.x_number ILIKE '%' || search_term || '%' OR
     d.name ILIKE '%' || search_term || '%')
    AND (filter_status IS NULL OR filter_status = 'all' OR a.status = filter_status)
    AND (filter_date_from IS NULL OR a.appointment_date >= filter_date_from::DATE)
    AND (filter_date_to IS NULL OR a.appointment_date <= filter_date_to::DATE)
  ORDER BY a.appointment_date DESC, a.slot_number ASC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_appointments TO authenticated;
GRANT EXECUTE ON FUNCTION search_appointments TO anon;

-- Test the function
-- SELECT * FROM search_appointments('ama', NULL, NULL, NULL, 10, 0);
