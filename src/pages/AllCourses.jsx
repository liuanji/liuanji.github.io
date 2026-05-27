import { motion } from 'framer-motion';
import { BookOpen, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import GhostNav from '../components/layout/GhostNav';

export const courses = [
  {
    code: 'CS6281',
    title: 'Inference Algorithms in Deep Generative Models',
    semester: 'Spring 2026',
    institution: 'NUS',
    enrollment: '27 students',
    level: 'Graduate Seminar',
    description: 'An introduction to different generative models with a focus on their probabilistic semantics.',
    materials: 'https://canvas.nus.edu.sg/courses/90444',
  },
  {
    code: 'CS6101',
    title: 'From Autogressive to Diffusion (Language) Models',
    semester: 'Fall 2025',
    institution: 'NUS',
    enrollment: '6 students',
    level: 'Graduate Seminar',
    description: 'A reading group/seminar about diffusion language models.',
    // materials: '#',
  },
  {
    code: 'CS021862000',
    title: 'Reinforcement Learning',
    semester: 'Spring 2025',
    institution: 'Uni Stuttgart',
    enrollment: '150 students',
    level: 'Graduate',
    description: 'Introduction of fundamental RL concepts and algorithms.',
    // materials: '#',
  },
  {
    code: 'CS10110',
    title: 'Introduction to Artificial Intelligence',
    semester: 'Fall 2024',
    institution: 'Uni Stuttgart',
    enrollment: '300 students',
    level: 'Undergraduate',
    description: 'Introduction of basic AI algorithms.',
    // materials: '#',
  },
];

const levelColors = {
  'Undergraduate': 'text-data-grey bg-data-grey/8 border-data-grey/20',
  'Graduate': 'text-synapse bg-synapse/8 border-synapse/20',
  'Graduate Seminar': 'text-inkwell bg-inkwell/5 border-inkwell/15',
};

export default function AllCourses() {
  return (
    <div className="bg-paper min-h-screen page-enter">
      <GhostNav />
      <main className="pt-24 pb-28">
        <div className="max-w-6xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12"
          >
            <Link to="/#teaching" className="font-mono text-sm text-data-grey hover:text-inkwell transition-colors mb-4 inline-block">
              ← Back
            </Link>
            <div className="font-mono text-sm text-data-grey mb-3">Teaching</div>
            <h1 className="font-tight font-bold text-5xl lg:text-6xl text-inkwell">All Courses</h1>
            {/* <p className="text-data-grey mt-4 max-w-2xl text-base leading-relaxed">
              Complete teaching history at UCLA.
            </p> */}
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((course, i) => (
              <motion.div
                key={`${course.code}-${course.semester}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-2xl p-7 border border-border-light hover:border-inkwell/20 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="font-mono text-xl font-medium text-inkwell">{course.code}</div>
                  <span className={`font-mono text-xs border px-2 py-0.5 rounded ${levelColors[course.level]}`}>
                    {course.level}
                  </span>
                </div>
                <h3 className="font-tight font-semibold text-lg text-inkwell mb-3 leading-snug">
                  {course.title}
                </h3>
                <p className="text-sm text-data-grey leading-relaxed mb-5">
                  {course.description}
                </p>
                <div className="pt-4 border-t border-border-light flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-data-grey font-mono">
                      <BookOpen size={12} /> {course.semester}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-data-grey font-mono">
                      <Users size={12} /> {course.enrollment}
                    </div>
                  </div>
                  {course.materials && (
                    <a
                      href={course.materials}
                      className="flex items-center gap-1.5 text-xs font-medium text-synapse hover:text-inkwell transition-colors"
                    >
                      Materials <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}