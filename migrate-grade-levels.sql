-- Migration Script: Move grade levels from students to classes
-- Date: 2025-07-18
-- Purpose: Migrate grade_level from student-level to class-level property

-- Step 1: Update classes table with grade levels from their students
-- This takes the most common grade level from students in each class
UPDATE classes c
SET grade_level = (
    SELECT s.grade_level
    FROM students s
    WHERE s.class_id = c.id
      AND s.grade_level IS NOT NULL
      AND s.grade_level != ''
    GROUP BY s.grade_level
    ORDER BY COUNT(*) DESC
    LIMIT 1
)
WHERE c.grade_level IS NULL OR c.grade_level = '';

-- Step 2: For classes that still don't have a grade level (no students or all students have null grade)
-- Set a default based on typical patterns in class names
UPDATE classes
SET grade_level = 
    CASE 
        WHEN LOWER(name) LIKE '%6th%' OR LOWER(name) LIKE '%sixth%' THEN '6th Grade'
        WHEN LOWER(name) LIKE '%7th%' OR LOWER(name) LIKE '%seventh%' THEN '7th Grade'
        WHEN LOWER(name) LIKE '%8th%' OR LOWER(name) LIKE '%eighth%' THEN '8th Grade'
        WHEN LOWER(name) LIKE '%9th%' OR LOWER(name) LIKE '%ninth%' THEN '9th Grade'
        ELSE '7th Grade' -- Default to 7th grade if can't determine
    END
WHERE grade_level IS NULL OR grade_level = '';

-- Step 3: Log the migration results for verification
SELECT 
    c.id,
    c.name,
    c.class_code,
    c.grade_level as new_grade_level,
    COUNT(DISTINCT s.grade_level) as unique_student_grades,
    STRING_AGG(DISTINCT s.grade_level, ', ') as student_grades
FROM classes c
LEFT JOIN students s ON s.class_id = c.id
GROUP BY c.id, c.name, c.class_code, c.grade_level
ORDER BY c.created_at DESC;

-- Step 4: Verify no classes are missing grade levels
SELECT COUNT(*) as classes_without_grade_level
FROM classes
WHERE grade_level IS NULL OR grade_level = '';

-- Optional: Remove grade_level from students table after verification
-- This should only be run after confirming the migration was successful
-- ALTER TABLE students DROP COLUMN grade_level;