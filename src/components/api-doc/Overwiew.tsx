import { ApiDoc } from "@prisma/client";
import { ApiSpec } from "./types";
import ReactMarkdown from 'react-markdown';

interface ApiDocViewerProps {
    apiDoc: ApiDoc;
    spec: ApiSpec;
}

const Overview: React.FC<ApiDocViewerProps> = ({ apiDoc, spec }: { apiDoc: ApiDoc, spec: ApiSpec }) => {
    return (
        <div className="w-full max-w-[95%] xs:max-w-[90%] sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Logo ve Başlık */}
            <div className="space-y-2 xs:space-y-3 sm:space-y-4">
                <div className="flex items-center justify-center">
                    {apiDoc?.logo ? (
                        <img src={apiDoc.logo} alt="API Logo" className="h-10 xs:h-12 sm:h-14 lg:h-16 w-auto" />
                    ) : (
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center text-white text-xl xs:text-2xl sm:text-3xl font-bold">
                            {(spec?.info?.title || 'API').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600 px-2">
                    {spec?.info?.title || 'API Documentation'}
                </h1>
                <div className="text-sm xs:text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xs xs:max-w-sm sm:max-w-xl lg:max-w-2xl mx-auto px-2 prose dark:prose-invert">
                    <ReactMarkdown>
                        {spec?.info?.description || 'Welcome to our API documentation. Select an endpoint from the sidebar to get started.'}
                    </ReactMarkdown>
                </div>
            </div>

            {/* API Bilgileri */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-5 lg:gap-6 text-left px-2">
                {/* Versiyon Bilgisi */}
                <div className="bg-white dark:bg-gray-800 p-3 xs:p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 sm:mb-4 flex items-center">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Version Information
                    </h3>
                    <dl className="space-y-2 sm:space-y-3">
                        <div>
                            <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">API Version</dt>
                            <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-gray-100">{spec?.info?.version || 'Not specified'}</dd>
                        </div>
                        {spec?.info?.contact && (
                            <div>
                                <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Contact</dt>
                                <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                                    {spec.info.contact.name && <div>{spec.info.contact.name}</div>}
                                    {spec.info.contact.email && (
                                        <a href={`mailto:${spec.info.contact.email}`} className="text-blue-500 hover:text-blue-600 break-all">
                                            {spec.info.contact.email}
                                        </a>
                                    )}
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>

                {/* Server Information */}
                <div className="bg-white dark:bg-gray-800 p-3 xs:p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 sm:mb-4 flex items-center">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                        </svg>
                        Server Information
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                        {spec?.servers?.map((server, index) => (
                            <div key={index} className="text-xs sm:text-sm">
                                <div className="font-medium text-gray-500 dark:text-gray-400">Server {index + 1}</div>
                                <div className="mt-1 text-gray-900 dark:text-gray-100">{server.url}</div>
                                {server.description && (
                                    <div className="mt-1 text-gray-500 dark:text-gray-400">{server.description}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hızlı Başlangıç */}
                <div className="bg-white dark:bg-gray-800 p-3 xs:p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 sm:mb-4 flex items-center">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Quick Start
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            Browse the API endpoints in the sidebar to:
                        </p>
                        <ul className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-2 sm:space-y-3 list-none">
                            <li className="flex items-center">
                                <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1 sm:mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                View detailed documentation
                            </li>
                            <li className="flex items-center">
                                <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1 sm:mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Test endpoints directly
                            </li>
                            <li className="flex items-center">
                                <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1 sm:mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                See request/response examples
                            </li>
                            <li className="flex items-center">
                                <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1 sm:mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Explore parameters
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Lisans ve Terms */}
            {(spec?.info?.license || spec?.info?.termsOfService) && (
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {spec.info.license && (
                        <div className="flex items-center justify-center">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            License: {spec.info.license.name}
                            {spec.info.license.url && (
                                <a href={spec.info.license.url} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 hover:text-blue-600 inline-flex items-center">
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
                            <a href={spec.info.termsOfService} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 inline-flex items-center">
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
    );
}

export default Overview;