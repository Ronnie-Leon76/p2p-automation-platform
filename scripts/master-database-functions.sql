-- Master database functions for optimization system
-- Run this ONCE in your Supabase SQL Editor

-- Function to execute migration SQL safely
CREATE OR REPLACE FUNCTION execute_migration_sql(sql_commands TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_commands;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'Migration SQL failed: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table indexes
CREATE OR REPLACE FUNCTION get_table_indexes(table_name TEXT)
RETURNS TABLE(indexname NAME, indexdef TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT pi.indexname, pi.indexdef
  FROM pg_indexes pi
  WHERE pi.tablename = $1 AND pi.schemaname = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table policies
CREATE OR REPLACE FUNCTION get_table_policies(table_name TEXT)
RETURNS TABLE(
  policyname NAME,
  permissive TEXT,
  roles NAME[],
  cmd TEXT,
  qual TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.policyname,
    p.permissive::TEXT,
    p.roles,
    p.cmd,
    p.qual
  FROM pg_policies p
  WHERE p.tablename = $1 AND p.schemaname = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all performance-related indexes
CREATE OR REPLACE FUNCTION get_all_performance_indexes()
RETURNS TABLE(
  tablename NAME,
  indexname NAME,
  indexdef TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pi.tablename,
    pi.indexname,
    pi.indexdef
  FROM pg_indexes pi
  WHERE pi.schemaname = 'public'
    AND pi.tablename IN ('activity_logs', 'teams', 'team_members', 'exchange_configs', 'ads', 'orders')
    AND pi.indexname LIKE 'idx_%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get database performance stats
CREATE OR REPLACE FUNCTION get_performance_stats()
RETURNS TABLE(
  table_name NAME,
  total_rows BIGINT,
  seq_scans BIGINT,
  index_scans BIGINT,
  cache_hit_ratio NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pst.relname as table_name,
    pst.n_tup_ins + pst.n_tup_upd + pst.n_tup_del as total_rows,
    pst.seq_scan as seq_scans,
    pst.idx_scan as index_scans,
    CASE 
      WHEN pst.seq_scan + pst.idx_scan = 0 THEN 0
      ELSE ROUND((pst.idx_scan::NUMERIC / (pst.seq_scan + pst.idx_scan)) * 100, 2)
    END as cache_hit_ratio
  FROM pg_stat_user_tables pst
  WHERE pst.relname IN ('activity_logs', 'teams', 'team_members', 'exchange_configs')
  ORDER BY total_rows DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION execute_migration_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_indexes(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_policies(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_performance_indexes() TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_stats() TO authenticated;

-- Create activity summary function (enhanced)
CREATE OR REPLACE FUNCTION get_activity_summary(
  team_id UUID,
  date_from TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  action VARCHAR(100),
  count BIGINT,
  latest_activity TIMESTAMP WITH TIME ZONE,
  unique_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.action,
    COUNT(*) as count,
    MAX(al.created_at) as latest_activity,
    COUNT(DISTINCT al.user_id) as unique_users
  FROM activity_logs al
  WHERE al.team_id = $1
    AND al.created_at >= $2
  GROUP BY al.action
  ORDER BY count DESC, latest_activity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_activity_summary(UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;
