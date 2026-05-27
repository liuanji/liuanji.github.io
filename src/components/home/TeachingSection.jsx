import { motion } from 'framer-motion';
import { BookOpen, Users, ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { courses } from '../../pages/AllCourses';

const levelColors = {
  'Undergraduate': 'text-data-grey bg-data-grey/8 border-data-grey/20',
  'Graduate': 'text-synapse bg-synapse/8 border-synapse/20',
  'Graduate Seminar': 'text-inkwell bg-inkwell/5 border-inkwell/15',
};

export default function TeachingSection() {
  return (
    <section id="teaching" className="py-0 bg-paper">
      <div className="max-w-6xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <div className="font-mono text-sm text-data-grey mb-3">05 / Teaching</div>
          <h2 className="font-tight font-bold text-4xl lg:text-5xl text-inkwell">
            Courses & Instruction
          </h2>
          {/* <p className="text-data-grey mt-4 max-w-2xl text-base leading-relaxed">
            Committed to cultivating rigorous thinking and intellectual curiosity in the next
            generation of AI researchers and engineers.
          </p> */}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.slice(0, 3).map((course, i) => (
            <motion.div
              key={course.code}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
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
                    <BookOpen size={12} /> {course.semester} ({course.institution})
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

        <div className="mt-10 flex justify-center">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border-light text-sm font-medium text-data-grey hover:text-inkwell hover:border-inkwell/30 transition-all"
          >
            View All Courses <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}