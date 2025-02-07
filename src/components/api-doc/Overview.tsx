import { ApiDoc } from "@prisma/client";
import { ApiSpec } from "./types";
import ReactMarkdown from 'react-markdown';
import { useEffect, useRef, useState } from 'react';
import Image from "next/image";
import style from './markdown-styles.module.css';

interface ApiDocViewerProps {
    apiDoc: ApiDoc;
    spec: ApiSpec;
}

const Overview: React.FC<ApiDocViewerProps> = ({ apiDoc, spec }: { apiDoc: ApiDoc, spec: ApiSpec }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            setMousePosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('mousemove', handleMouseMove);
            container.addEventListener('mouseenter', () => setIsHovering(true));
            container.addEventListener('mouseleave', () => setIsHovering(false));
        }

        return () => {
            if (container) {
                container.removeEventListener('mousemove', handleMouseMove);
                container.removeEventListener('mouseenter', () => setIsHovering(true));
                container.removeEventListener('mouseleave', () => setIsHovering(false));
            }
        };
    }, []);

    return (
        <div className="relative min-h-full overflow-hidden">
            {/* Fantastic Background */}
            <div className="fixed inset-0 -z-10">
                {/* Base gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />

                {/* Animated stars */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]">
                        <div className="absolute -inset-[10px] opacity-50">
                            {[...Array(100)].map((_, i) => (
                                <div
                                    key={i.toString() + Math.random().toString()}
                                    className="absolute rounded-full bg-white"
                                    style={{
                                        top: `${Math.random() * 100}%`,
                                        left: `${Math.random() * 100}%`,
                                        width: `${Math.random() * 2 + 1}px`,
                                        height: `${Math.random() * 2 + 1}px`,
                                        animation: `twinkle ${Math.random() * 5 + 3}s ease-in-out infinite`,
                                        animationDelay: `${Math.random() * 5}s`
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Animated nebula effects */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s' }} />
                    <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
                    <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
                </div>

                {/* Animated gradient lines */}
                <div className="absolute inset-0">
                    <div className="absolute top-[10%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent animate-scan" />
                    <div className="absolute top-[20%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent animate-scan" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-[30%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-scan" style={{ animationDelay: '2s' }} />
                </div>

                {/* Mouse following glow */}
                {isHovering && (
                    <div
                        className="absolute w-[500px] h-[500px] transition-transform duration-300 ease-out"
                        style={{
                            left: mousePosition.x - 250,
                            top: mousePosition.y - 250,
                            background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
                            transform: 'translate(-50%, -50%)'
                        }}
                    />
                )}

                {/* Hexagon grid */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 L15 0 L45 0 L60 30 L45 60 L15 60' fill='none' stroke='white' stroke-opacity='0.2'/%3E%3C/svg%3E")`,
                        backgroundSize: '60px 60px'
                    }} />
                </div>
            </div>

            {/* Content */}
            <div ref={containerRef} className="relative w-full max-w-[95%] xs:max-w-[90%] p-3">
                {/* Content with glass effect */}
                <div className="relative space-y-2 xs:space-y-3 sm:space-y-4 mb-8">
                    <div className="flex items-center justify-center transform transition-transform duration-300 hover:scale-105 fade-in">
                        {apiDoc?.logo ? (
                            <Image width={60} height={60} src={apiDoc.logo} alt="API Logo" className="h-10 xs:h-12 sm:h-14 lg:h-16 w-auto filter hover:brightness-110 transition-all duration-300" />
                        ) : (
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-300" />
                                <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-500 dark:to-purple-600 w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center text-white text-xl xs:text-2xl sm:text-3xl font-bold hover:shadow-indigo-500/50 transform transition-all duration-300 hover:scale-105 hover:-rotate-3">
                                    {(spec?.info?.title || 'API').charAt(0).toUpperCase()}
                                </div>
                            </div>
                        )}
                    </div>
                    <h1 className="relative text-lg xs:text-2xl sm:text-3xl lg:text-4xl font-bold fade-in">
                        <span className="absolute inset-0" />
                        <span className="relative">
                            {spec?.info?.title || 'API Documentation'}
                        </span>
                    </h1>
                    <div className="relative text-sm xs:text-base sm:text-lg text-gray-700 dark:text-gray-300/90 px-2 prose dark:prose-invert fade-in">
                        <div className="prose-sm xs:prose-base sm:prose-lg prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-indigo-600 dark:prose-a:text-indigo-400 hover:prose-a:text-indigo-500 prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-code:bg-gray-100 dark:prose-code:bg-gray-800/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800/50 prose-pre:p-4 prose-pre:rounded-lg prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700 dark:prose-li:text-gray-300">
                            <ReactMarkdown

                                className={style.reactMarkDown}
                            >
                                {spec?.info?.description ?? 'Welcome to our API documentation. Select an endpoint from the sidebar to get started.'}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>

                {/* API Info Cards */}
                <div className="relative grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-5 lg:gap-6 text-left px-2">
                    {/* Version Info Card */}
                    <div className="group relative fade-in">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-75 transition duration-300" />
                        <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-xl p-3 xs:p-4 sm:p-5 lg:p-6 rounded-xl border border-gray-200/50 dark:border-white/10 hover:border-indigo-500/50 transition-all duration-300 h-full">
                            <h3 className="text-xs sm:text-sm font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-2 sm:mb-4 flex items-center">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Version Information
                            </h3>
                            <dl className="space-y-2 sm:space-y-3">
                                <div>
                                    <dt className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">API Version</dt>
                                    <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-white">{spec?.info?.version || 'Not specified'}</dd>
                                </div>
                                {spec?.info?.contact && (
                                    <div>
                                        <dt className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Contact</dt>
                                        <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-white">
                                            {spec.info.contact.name && <div>{spec.info.contact.name}</div>}
                                            {spec.info.contact.email && (
                                                <a href={`mailto:${spec.info.contact.email}`} className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 break-all transition-colors">
                                                    {spec.info.contact.email}
                                                </a>
                                            )}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>

                    {/* Server Info Card */}
                    <div className="group relative fade-in">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl blur opacity-20 group-hover:opacity-75 transition duration-300" />
                        <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-xl p-3 xs:p-4 sm:p-5 lg:p-6 rounded-xl border border-gray-200/50 dark:border-white/10 hover:border-purple-500/50 transition-all duration-300 h-full">
                            <h3 className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-2 sm:mb-4 flex items-center">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                </svg>
                                Server Information
                            </h3>
                            <div className="space-y-2 sm:space-y-3">
                                {spec?.servers?.map((server, index) => (
                                    <div key={index.toString() + Math.random().toString()} className="text-xs sm:text-sm">
                                        <div className="font-medium text-gray-600 dark:text-gray-400">Server {index + 1}</div>
                                        <div className="mt-1 text-gray-900 dark:text-white">{server.url}</div>
                                        {server.description && (
                                            <div className="mt-1 text-gray-600 dark:text-gray-400">{server.description}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Start Card */}
                    <div className="group relative fade-in">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur opacity-20 group-hover:opacity-75 transition duration-300" />
                        <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-xl p-3 xs:p-4 sm:p-5 lg:p-6 rounded-xl border border-gray-200/50 dark:border-white/10 hover:border-blue-500/50 transition-all duration-300 h-full">
                            <h3 className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2 sm:mb-4 flex items-center">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Quick Start
                            </h3>
                            <div className="space-y-2 sm:space-y-3">
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                    Browse the API endpoints in the sidebar to:
                                </p>
                                <ul className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-2 sm:space-y-3 list-none">
                                    <li className="flex items-center">
                                        <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1 sm:mr-2 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        View detailed documentation
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1 sm:mr-2 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Test endpoints directly
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1 sm:mr-2 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        See request/response examples
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1 sm:mr-2 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Explore parameters
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* License and Terms */}
                {(spec?.info?.license || spec?.info?.termsOfService) && (
                    <div className="relative text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-2 pt-4 border-t border-gray-200/50 dark:border-white/10">
                        {spec.info.license && (
                            <div className="flex items-center justify-center">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                </svg>
                                License: {spec.info.license.name}
                                {spec.info.license.url && (
                                    <a href={spec.info.license.url} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center">
                                        (View License)
                                        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4a2 2 0 01-2 2M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2m-2-4h.01M17 16h.01" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        )}
                        {spec.info.termsOfService && (
                            <div className="flex items-center justify-center">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <a href={spec.info.termsOfService} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center">
                                    Terms of Service
                                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4a2 2 0 01-2 2M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2m-2-4h.01M17 16h.01" />
                                    </svg>
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Overview;