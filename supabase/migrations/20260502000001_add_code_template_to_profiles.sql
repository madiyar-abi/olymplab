-- Migration: add code_template to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS code_template text;
