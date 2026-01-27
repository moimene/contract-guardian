-- 011_lovable_diagnostic.sql
-- Purpose: Run diagnostics requested by Lovable to debug 'Database error querying schema'
-- usage: Run this in Supabase SQL Editor and share results if needed.

-- 1. Ver si hay errores en el trigger actual
SELECT 
  tgname as trigger_name,
  proname as function_name,
  prosrc as function_source
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass;

-- 2. Verificar que las tablas necesarias existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_roles', 'org_memberships', 'organizations');

-- 3. Ver estructura de profiles (por si falta alguna columna)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- 4. Ver estructura de user_roles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_roles' AND table_schema = 'public';
