-- Run this in Supabase SQL editor for Dashboard

CREATE TABLE health_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  bmi DECIMAL,
  heart_rate INTEGER,
  weight DECIMAL,
  diet_score INTEGER CHECK (diet_score BETWEEN 0 AND 10),
  exercise_score INTEGER CHECK (exercise_score BETWEEN 0 AND 10),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own logs" ON health_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE diagnoses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  summary TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  conditions JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own diagnoses" ON diagnoses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sample data (replace YOUR_USER_ID)
INSERT INTO health_logs (user_id, date, bmi, heart_rate, weight, diet_score, exercise_score) VALUES
('YOUR_USER_ID', '2024-10-01', 24.5, 72, 70.5, 8, 7),
('YOUR_USER_ID', '2024-10-02', 24.3, 70, 70.2, 9, 8);

INSERT INTO diagnoses (user_id, date, summary, severity, conditions) VALUES
('YOUR_USER_ID', '2024-10-01', 'Mild respiratory symptoms', 'low', '["Cold", "Allergy"]');

