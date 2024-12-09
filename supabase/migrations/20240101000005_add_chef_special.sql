-- Add is_chef_special column to meals table
ALTER TABLE meals ADD COLUMN is_chef_special BOOLEAN DEFAULT false;
