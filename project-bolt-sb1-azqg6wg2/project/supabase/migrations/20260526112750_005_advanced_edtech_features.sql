/*
  # Advanced EdTech Features Schema

  1. New Tables
    - `batches` - Student groups for batch-wise management
    - `batch_students` - Student-batch relationships
    - `live_classes` - Online class sessions with video conference integration
    - `class_attendees` - Live class attendance tracking
    - `payment_reminders` - Automated payment reminder system

  2. Security
    - RLS enabled on all tables
    - Role-based access policies for admin, faculty, and students
*/

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  department text DEFAULT '',
  year text DEFAULT '',
  start_date date,
  end_date date,
  capacity int DEFAULT 50,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Batch students relationship
CREATE TABLE IF NOT EXISTS batch_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  UNIQUE(batch_id, student_id)
);

-- Live Classes table
CREATE TABLE IF NOT EXISTS live_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  batch_id uuid REFERENCES batches(id) ON DELETE SET NULL,
  instructor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  duration_minutes int DEFAULT 60,
  meeting_url text DEFAULT '',
  meeting_platform text DEFAULT 'zoom' CHECK (meeting_platform IN ('zoom', 'google_meet', 'teams', 'other')),
  meeting_id text DEFAULT '',
  meeting_password text DEFAULT '',
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  recording_url text DEFAULT '',
  max_participants int DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Class attendees
CREATE TABLE IF NOT EXISTS class_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_class_id uuid NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  joined_at timestamptz,
  left_at timestamptz,
  duration_minutes int DEFAULT 0,
  UNIQUE(live_class_id, student_id)
);

-- Payment reminders
CREATE TABLE IF NOT EXISTS payment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  type text DEFAULT 'due_fee' CHECK (type IN ('due_fee', 'payment_pending', 'overdue', 'custom')),
  title text NOT NULL,
  message text NOT NULL,
  amount decimal(10,2) DEFAULT 0,
  due_date date,
  sent_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for batches
CREATE POLICY "Admins manage batches"
  ON batches FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Faculty read batches"
  ON batches FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'faculty'))
  );

-- RLS Policies for batch_students
CREATE POLICY "Admins manage batch students"
  ON batch_students FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Students read own batch"
  ON batch_students FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- RLS Policies for live_classes
CREATE POLICY "Admins manage live classes"
  ON live_classes FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Faculty manage own live classes"
  ON live_classes FOR ALL
  TO authenticated
  USING (
    instructor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Students read enrolled live classes"
  ON live_classes FOR SELECT
  TO authenticated
  USING (
    batch_id IN (
      SELECT batch_id FROM batch_students bs
      JOIN students s ON s.id = bs.student_id
      WHERE s.user_id = auth.uid()
    ) OR
    course_id IN (
      SELECT course_id FROM enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE s.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'faculty'))
  );

-- RLS Policies for class_attendees
CREATE POLICY "Students manage own attendance"
  ON class_attendees FOR ALL
  TO authenticated
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Faculty read class attendees"
  ON class_attendees FOR SELECT
  TO authenticated
  USING (
    live_class_id IN (
      SELECT id FROM live_classes WHERE instructor_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for payment_reminders
CREATE POLICY "Students read own reminders"
  ON payment_reminders FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins manage reminders"
  ON payment_reminders FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_batch_students_batch ON batch_students(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_student ON batch_students(student_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_instructor ON live_classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_scheduled ON live_classes(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_live_classes_status ON live_classes(status);
CREATE INDEX IF NOT EXISTS idx_class_attendees_live ON class_attendees(live_class_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_student ON payment_reminders(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_status ON payment_reminders(status);
