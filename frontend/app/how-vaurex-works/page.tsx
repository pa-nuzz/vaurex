"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Upload, Brain, FileText, CheckCircle, TrendingUp, Users } from "lucide-react";
import PremiumButton from "@/components/ui/PremiumButton";
import PremiumCard from "@/components/ui/PremiumCard";

export default function HowVaurexWorksPage() {
  return (
    <div className="min-h-screen bg-white-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Back Navigation */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-600 mb-8 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How Vaurex Works</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Understand the complete workflow of our AI-powered document analysis platform
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Step 1 */}
          <PremiumCard className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Upload size={32} className="text-orange-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Upload Documents</h3>
            <p className="text-gray-600 mb-4">
              Upload PDFs, images, or text files directly to our secure platform. We support multiple formats for comprehensive analysis.
            </p>
            <ul className="text-left text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-1 flex-shrink-0" />
                <span>Drag & drop or click to upload</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-1 flex-shrink-0" />
                <span>Automatic file format detection</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-1 flex-shrink-0" />
                <span>Secure cloud storage</span>
              </li>
            </ul>
          </PremiumCard>

          {/* Step 2 */}
          <PremiumCard className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Brain size={32} className="text-blue-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">2. AI Analysis</h3>
            <p className="text-gray-600 mb-4">
              Our advanced AI models analyze your documents for risks, entities, compliance issues, and more using cutting-edge technology.
            </p>
            <ul className="text-left text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-1 flex-shrink-0" />
                <span>Multi-model AI processing</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-1 flex-shrink-0" />
                <span>Risk scoring (0-100 scale)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-1 flex-shrink-0" />
                <span>Entity extraction</span>
              </li>
            </ul>
          </PremiumCard>

          {/* Step 3 */}
          <PremiumCard className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <FileText size={32} className="text-green-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Get Results</h3>
            <p className="text-gray-600 mb-4">
              Receive detailed reports with risk scores, compliance checks, and actionable insights within seconds.
            </p>
            <ul className="text-left text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-1 flex-shrink-0" />
                <span>Comprehensive reports</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-1 flex-shrink-0" />
                <span>Export to multiple formats</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-1 flex-shrink-0" />
                <span>Real-time collaboration</span>
              </li>
            </ul>
          </PremiumCard>
        </div>

        {/* Features Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Platform Features</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PremiumCard>
              <Shield className="text-orange-500 mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Security First</h4>
              <p className="text-gray-600 text-sm">
                Enterprise-grade encryption and compliance with SOC 2, GDPR, and industry standards.
              </p>
            </PremiumCard>

            <PremiumCard>
              <TrendingUp className="text-blue-500 mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Smart Analytics</h4>
              <p className="text-gray-600 text-sm">
                AI-powered insights with risk scoring and trend analysis for better decision making.
              </p>
            </PremiumCard>

            <PremiumCard>
              <Users className="text-green-500 mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Team Ready</h4>
              <p className="text-gray-600 text-sm">
                Real-time collaboration with role-based access and audit trails for teams.
              </p>
            </PremiumCard>

            <PremiumCard>
              <CheckCircle className="text-orange-500 mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Compliance Focused</h4>
              <p className="text-gray-600 text-sm">
                Automated compliance checking across multiple frameworks with detailed reporting.
              </p>
            </PremiumCard>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6">
            Join thousands of professionals using Vaurex for secure document analysis and compliance management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PremiumButton href="/register" size="lg" className="w-full sm:w-auto">
              Start Free Trial
            </PremiumButton>
            <PremiumButton href="/demo" variant="outline" size="lg" className="w-full sm:w-auto">
              Try Demo
            </PremiumButton>
          </div>
        </div>
      </div>
    </div>
  );
}
