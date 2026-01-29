"use client"

import Link from "next/link"
import { features } from "@/lib/features"
import { useSession } from "next-auth/react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

export default function Home() {
  const { data: session } = useSession()
  const featuresRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: featuresRef,
    offset: ["start end", "end start"]
  })

  useTransform(scrollYProgress, [0, 1], ["20%", "-20%"])
  useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  }

  return (
    <div className="relative isolate bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute h-full w-full bg-gradient-to-b from-indigo-500/20 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-40" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl"
            >
              Your Personal API Documentation Hub
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-6 text-lg leading-8 text-gray-700 dark:text-gray-300 sm:text-xl"
            >
              Create your own API documentation library by importing OpenAPI 3.0 specifications. Test, manage, and share your APIs with an interactive and modern interface.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-10 flex items-center justify-center gap-x-6"
            >
              {session ? (
                <Link
                  href="/dashboard"
                  className="rounded-full bg-indigo-500 px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 transition-all duration-300"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="rounded-full bg-indigo-500 px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 transition-all duration-300"
                  >
                    Create Your API Hub
                  </Link>
                  <Link
                    href="/login"
                    className="text-base font-semibold leading-6 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
                  >
                    Log in <span aria-hidden="true">→</span>
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div ref={featuresRef} className="relative py-24 sm:py-32">
        <div className="absolute inset-0 flex justify-center">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-40" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center"
        >
          <h2 className="text-base font-semibold leading-7 text-indigo-400">Powerful Features</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
            Everything You Need for API Documentation
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="relative mx-auto max-w-7xl px-6 lg:px-8 mt-16 sm:mt-20 lg:mt-24"
        >
          <dl className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:grid-cols-3">
            {features.map((feature) => (
              <motion.div
                key={feature.name}
                variants={item}
                whileHover={{ scale: 1.02 }}
                className="group relative"
              >
                <div className="relative h-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800/50 p-8 ring-1 ring-inset ring-white/10 dark:ring-gray-700/10 backdrop-blur-lg transition-all duration-300 hover:ring-indigo-500/50">
                  <div className="absolute -inset-px bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-10" />

                  <dt className="flex flex-col items-start gap-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-500/50">
                      <feature.icon className="h-8 w-8 text-white transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                    </div>
                    <span className="text-xl font-semibold leading-7 text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-indigo-400">
                      {feature.name}
                    </span>
                  </dt>
                  <dd className="mt-4 text-base leading-7 text-gray-700 dark:text-gray-300 transition-colors duration-300 group-hover:text-gray-100 dark:group-hover:text-gray-100">
                    {feature.description}
                  </dd>
                </div>
              </motion.div>
            ))}
          </dl>
        </motion.div>
      </div>

      {/* Contact Section */}
      <div className="relative py-24 sm:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute h-full w-full bg-gradient-to-b from-indigo-500/20 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-40" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative isolate overflow-hidden bg-gray-100 dark:bg-gray-800/50 px-6 py-12 shadow-2xl rounded-3xl backdrop-blur-sm ring-1 ring-white/10 dark:ring-gray-700/10 sm:px-24 xl:py-16"
          >
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Let&apos;s Build Something Amazing Together</h2>
              <p className="mt-4 text-lg leading-8 text-gray-700 dark:text-gray-300">
                Have questions or need help? Feel free to reach out. We&apos;re here to help you create amazing API documentation.
              </p>
              <div className="mt-8 flex justify-center gap-x-6">
                <Link
                  href="https://cihantaylan.com"
                  className="rounded-xl bg-indigo-500 px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 transition-all duration-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get in Touch
                </Link>
                <Link
                  href="https://github.com/cihanTAYLAN/just-api-doc"
                  className="rounded-xl bg-white/10 dark:bg-gray-700/10 px-8 py-4 text-base font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-white/20 dark:ring-gray-700/20 hover:bg-white/20 dark:hover:bg-gray-600 hover:ring-white/30 dark:hover:ring-gray-600 transition-all duration-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </Link>
              </div>
            </div>
            <svg
              viewBox="0 0 1024 1024"
              className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 -translate-y-1/2"
              aria-hidden="true"
            >
              <circle cx="512" cy="512" r="512" fill="url(#radial)" fillOpacity="0.05" />
              <defs>
                <radialGradient id="radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(512 512) rotate(90) scale(512)">
                  <stop stopColor="#7C3AED" />
                  <stop offset="1" stopColor="#7C3AED" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <a
              href="https://github.com/cihanTAYLAN/just-api-doc"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-400 dark:hover:text-gray-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">GitHub</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href="https://twitter.com/cihantaylan24"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-400 dark:hover:text-gray-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-sm leading-5 text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Just API Doc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
