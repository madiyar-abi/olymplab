-- Migration: add preferred_language to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'cpp';
