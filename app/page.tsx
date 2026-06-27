'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useWallet } from '@/lib/wallet-context';
import {
  Zap, Shield, ArrowRight, Globe, CheckCircle,
  FileText, Users, Lock, Wallet, ChevronDown,
  ArrowUpRight, Layers, Eye, Coins
} from 'lucide-react';

function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="stat-number" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'none' : 'translateY(10px)', transition: 'all 0.6s ease-out' }}>
      {value}{suffix}
    </div>
  );
}

export default function LandingPage() {
  const { isConnected, connect } = useWallet();
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <FileText size={24} />,
      title: 'Invoice Tokenization',
      description: 'Transform invoices into tradeable on-chain digital assets with unique token IDs.',
      color: 'var(--neon-green)',
    },
    {
      icon: <Shield size={24} />,
      title: 'Digital Handshake',
      description: 'Buyer verification on-chain creates trustless proof of invoice validity.',
      color: 'var(--neon-cyan)',
    },
    {
      icon: <Lock size={24} />,
      title: 'KYC Compliance',
      description: 'Built-in AUTHORIZATION_REQUIRED checks ensure only verified investors participate.',
      color: 'var(--neon-purple)',
    },
    {
      icon: <Zap size={24} />,
      title: 'Instant Settlement',
      description: 'T+0 settlement. Suppliers receive funds the moment an investor funds the invoice.',
      color: 'var(--neon-green)',
    },
    {
      icon: <Layers size={24} />,
      title: 'Fractional Investment',
      description: 'Investors can fund fractions of large invoices, democratizing access.',
      color: 'var(--neon-cyan)',
    },
    {
      icon: <Wallet size={24} />,
      title: 'Freighter Integration',
      description: 'Seamless wallet signing and transaction management with Freighter.',
      color: 'var(--neon-purple)',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Mint Invoice',
      role: 'Supplier',
      description: 'Supplier creates a tokenized invoice on-chain with amount, due date, and buyer details.',
      color: 'var(--neon-green)',
    },
    {
      number: '02',
      title: 'Verify & Approve',
      role: 'Buyer',
      description: 'Buyer reviews and approves the invoice on-chain, creating a digital handshake.',
      color: 'var(--neon-cyan)',
    },
    {
      number: '03',
      title: 'KYC Approval',
      role: 'Admin',
      description: 'Admin verifies investor identity and grants authorization to participate.',
      color: 'var(--neon-purple)',
    },
    {
      number: '04',
      title: 'Fund Invoice',
      role: 'Investor',
      description: 'Investor funds the verified invoice. sUSDC flows instantly to the supplier.',
      color: 'var(--neon-green)',
    },
  ];

  const stats = [
    { value: '$5.2T', label: 'Financing Gap', sub: 'Global MSME Shortfall' },
    { value: '< 5m', label: 'Settlement Time', sub: 'Instant Liquidity' },
    { value: '0.1%', label: 'Platform Fee', sub: 'Lowest in Industry' },
    { value: '100%', label: 'Transparent', sub: 'On-Chain Verifiable' },
  ];

  return (
    <div className="w-full relative overflow-x-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Animated background mesh */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div
          className="orb-green"
          style={{
            top: `${-100 + scrollY * 0.08}px`,
            right: '-100px',
            opacity: 0.35,
          }}
        />
        <div
          className="orb-cyan"
          style={{
            bottom: `${200 - scrollY * 0.04}px`,
            left: '-50px',
            opacity: 0.25,
          }}
        />
        <div
          className="orb-purple"
          style={{
            top: `${400 + scrollY * 0.02}px`,
            right: '20%',
            opacity: 0.15,
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-black text-sm"
              style={{ background: 'linear-gradient(135deg, var(--neon-green), #2bcc10)', boxShadow: '0 0 20px var(--neon-green-glow-strong)' }}
            >
              S
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Setu</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How it Works', 'Solutions'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm font-medium transition-all duration-300 hover:text-[var(--text-primary)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <Link href="/app" className="btn-neon flex items-center gap-2 no-underline text-sm">
                Launch App <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <button onClick={connect} className="btn-ghost text-sm">Sign In</button>
                <Link href="/app" className="btn-neon flex items-center gap-2 no-underline text-sm">
                  Launch App <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ═══════════════════════ HERO SECTION ═══════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium mb-10 animate-fade-in-up"
            style={{
              background: 'linear-gradient(135deg, rgba(57, 255, 20, 0.1), rgba(57, 255, 20, 0.04))',
              border: '1px solid rgba(57, 255, 20, 0.2)',
              color: 'var(--neon-green)',
              boxShadow: '0 0 20px rgba(57, 255, 20, 0.06)',
            }}
          >
            <span className="status-dot status-dot-active" />
            Live on Stellar Testnet
          </div>

          {/* Heading */}
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[0.95] tracking-tight animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            <span style={{ color: 'var(--text-primary)' }}>Invoice Financing</span>
            <br />
            <span className="neon-text" style={{ display: 'inline-block', marginTop: '8px' }}>Reimagined</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up"
            style={{ color: 'var(--text-secondary)', animationDelay: '0.2s' }}
          >
            Turn your unpaid invoices into instant working capital. Transparent,
            decentralized, and powered by Soroban smart contracts.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link href="/app" className="btn-neon flex items-center gap-2 no-underline text-base px-10 py-4">
              Get Started Now <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn-outline flex items-center gap-2 no-underline text-base px-10 py-4">
              <Eye size={18} /> Watch Demo
            </a>
          </div>

          {/* Stats row */}
          <div
            id="solutions"
            className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-4xl mx-auto animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                className="card card-neon p-6 text-center relative overflow-hidden group"
              >
                {/* Gradient accent top */}
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--neon-green), transparent)' }} />
                <AnimatedCounter value={stat.value} />
                <div className="text-[10px] font-semibold uppercase tracking-[0.15em] mt-2 mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {stat.label}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="mt-20 flex flex-col items-center gap-2 animate-float">
            <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Scroll to explore</span>
            <ChevronDown size={20} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="section-divider" />

      {/* ═══════════════════════ FEATURES SECTION ═══════════════════════ */}
      <section id="features" className="relative py-32 mesh-gradient-bg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="badge badge-neon mb-4 mx-auto">
              <Zap size={12} /> Core Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-5">
              <span style={{ color: 'var(--text-primary)' }}>Built for Trust. </span>
              <span className="neon-text-subtle">Optimized for Speed.</span>
            </h2>
            <p className="text-base max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Setu leveraging the Stellar blockchain to remove intermediaries, reduce
              costs, and prevent fraud through cryptographic verification.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {features.map((feature, i) => (
              <div
                key={i}
                className="card card-neon p-8 group cursor-default relative overflow-hidden"
              >
                {/* Gradient corner accent */}
                <div
                  className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at top right, ${feature.color}10, transparent 70%)` }}
                />
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg relative z-10"
                  style={{
                    background: `${feature.color}15`,
                    color: feature.color,
                    border: `1px solid ${feature.color}25`,
                    boxShadow: `0 0 0 0 ${feature.color}00`,
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-3 relative z-10" style={{ color: 'var(--text-primary)' }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed relative z-10" style={{ color: 'var(--text-secondary)' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="section-divider" />

      {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
      <section id="how-it-works" className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="badge badge-cyan mb-4 mx-auto">
              <Layers size={12} /> Process
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-5">
              <span style={{ color: 'var(--text-primary)' }}>How </span>
              <span className="neon-text-subtle">Setu</span>
              <span style={{ color: 'var(--text-primary)' }}> Works</span>
            </h2>
            <p className="text-base max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              A seamless four-step process from invoice creation to instant settlement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden lg:block absolute top-1/2 left-[12.5%] right-[12.5%] h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(57,255,20,0.2), rgba(0,240,255,0.2), rgba(191,90,242,0.2), rgba(57,255,20,0.2))' }} />

            {steps.map((step, i) => (
              <div
                key={i}
                className={`card p-8 relative overflow-hidden transition-all duration-500 group ${
                  activeFeature === i ? 'card-neon' : ''
                }`}
                style={{
                  borderColor: activeFeature === i ? `${step.color}33` : undefined,
                  zIndex: 10,
                }}
                onMouseEnter={() => setActiveFeature(i)}
              >
                {/* Step number watermark */}
                <div
                  className="text-7xl font-black absolute top-3 right-4 transition-opacity duration-300"
                  style={{ color: step.color, opacity: activeFeature === i ? 0.15 : 0.06 }}
                >
                  {step.number}
                </div>

                {/* Step indicator dot */}
                <div
                  className="w-3 h-3 rounded-full mb-5 relative z-20 transition-all duration-300"
                  style={{
                    background: step.color,
                    boxShadow: activeFeature === i ? `0 0 12px ${step.color}60` : 'none',
                  }}
                />

                {/* Role badge */}
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4 relative z-10"
                  style={{
                    background: `${step.color}12`,
                    color: step.color,
                    border: `1px solid ${step.color}25`,
                  }}
                >
                  <Users size={11} />
                  {step.role}
                </div>

                <h3 className="text-lg font-bold mb-2 relative z-10" style={{ color: 'var(--text-primary)' }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed relative z-10" style={{ color: 'var(--text-secondary)' }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="section-divider" />

      {/* ═══════════════════════ PROBLEM / SOLUTION ═══════════════════════ */}
      <section className="relative py-32 mesh-gradient-bg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-5">
              <span style={{ color: 'var(--text-primary)' }}>Why </span>
              <span className="neon-text-subtle">Setu</span>
              <span style={{ color: 'var(--text-primary)' }}>?</span>
            </h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Problem */}
            <div className="card p-9 relative overflow-hidden" style={{ borderColor: 'rgba(255, 68, 68, 0.15)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, var(--danger), transparent)' }} />
              <div className="flex items-center gap-4 mb-7">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'rgba(255, 68, 68, 0.12)', color: 'var(--danger)', border: '1px solid rgba(255,68,68,0.15)' }}
                >
                  ⚠️
                </div>
                <h3 className="text-2xl font-bold" style={{ color: 'var(--danger)' }}>The Problem</h3>
              </div>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Cash flow is the #1 killer of MSMEs. Small businesses wait 30-90 days for payment while capital remains locked.
              </p>
              <div className="space-y-4">
                {['Paper-heavy & slow approvals', 'High hidden fees & lack of transparency', 'Minimum volume requirements exclude smaller suppliers'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm p-3 rounded-lg" style={{ color: 'var(--text-secondary)', background: 'rgba(255,68,68,0.04)', border: '1px solid rgba(255,68,68,0.08)' }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0" style={{ background: 'rgba(255,68,68,0.15)', color: 'var(--danger)' }}>✕</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Solution */}
            <div className="card card-neon p-9 relative overflow-hidden" style={{ borderColor: 'rgba(57, 255, 20, 0.15)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, var(--neon-green), transparent)' }} />
              <div className="flex items-center gap-4 mb-7">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--neon-green-subtle)', color: 'var(--neon-green)', border: '1px solid rgba(57,255,20,0.15)' }}
                >
                  <Zap size={22} />
                </div>
                <h3 className="text-2xl font-bold neon-text-subtle">The Solution</h3>
              </div>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Setu bridges invoices and liquidity using Stellar. Tokenized invoices unlock instant capital from global investors.
              </p>
              <div className="space-y-4">
                {[
                  'T+0 instant settlement upon funding',
                  'Trustless buyer verification on-chain',
                  'Anyone with a Stellar wallet can invest & earn yield',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm p-3 rounded-lg" style={{ color: 'var(--text-secondary)', background: 'rgba(57,255,20,0.04)', border: '1px solid rgba(57,255,20,0.08)' }}>
                    <CheckCircle size={16} style={{ color: 'var(--neon-green)', flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="section-divider" />

      {/* ═══════════════════════ TECH STACK ═══════════════════════ */}
      <section className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="badge badge-neon mb-4 mx-auto">
              <Layers size={12} /> Architecture
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span style={{ color: 'var(--text-primary)' }}>Tech </span>
              <span className="neon-text-subtle">Stack</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {[
              { name: 'Stellar Soroban', desc: 'Blockchain', icon: <Globe size={28} />, color: 'var(--neon-green)' },
              { name: 'Rust / WASM', desc: 'Smart Contracts', icon: <Layers size={28} />, color: 'var(--neon-cyan)' },
              { name: 'Next.js 14', desc: 'Frontend', icon: <Zap size={28} />, color: 'var(--neon-purple)' },
              { name: 'Freighter', desc: 'Wallet', icon: <Wallet size={28} />, color: 'var(--neon-green)' },
              { name: 'sUSDC', desc: 'Token', icon: <Coins size={28} />, color: 'var(--neon-cyan)' },
            ].map((tech, i) => (
              <div key={i} className="card card-neon p-7 text-center group relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(90deg, transparent, ${tech.color}, transparent)` }} />
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: `${tech.color}12`,
                    color: tech.color,
                    border: `1px solid ${tech.color}20`,
                  }}
                >
                  {tech.icon}
                </div>
                <div className="text-sm font-semibold mb-1">{tech.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{tech.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="section-divider" />

      {/* ═══════════════════════ CTA SECTION ═══════════════════════ */}
      <section className="relative py-32 mesh-gradient-bg">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="card p-14 neon-border-subtle relative overflow-hidden">
            <div className="orb-green" style={{ top: '-200px', left: '50%', transform: 'translateX(-50%)', opacity: 0.12 }} />
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--neon-green), transparent)' }} />
            <h2 className="text-3xl md:text-5xl font-bold mb-5 relative z-10">
              Ready to <span className="neon-text-subtle">bridge</span> the gap?
            </h2>
            <p className="text-base mb-10 max-w-lg mx-auto relative z-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Join the future of invoice financing. Connect your Freighter wallet and start tokenizing invoices on Stellar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link href="/app" className="btn-neon flex items-center gap-2 no-underline text-base px-10 py-4">
                Launch App <ArrowUpRight size={18} />
              </Link>
              <a
                href="https://github.com/sohansarkar07/Setu"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline flex items-center gap-2 no-underline text-base px-10 py-4"
              >
                View on GitHub <ArrowUpRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-black text-xs"
              style={{ background: 'linear-gradient(135deg, var(--neon-green), #2bcc10)' }}
            >
              S
            </div>
            <span className="text-sm font-semibold">Setu</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>— RWA Tokenization on Stellar</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://stellar.org" target="_blank" rel="noopener" className="text-xs transition-colors hover:text-[var(--text-primary)]" style={{ color: 'var(--text-muted)' }}>
              Powered by Stellar
            </a>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Built for Stellar Journey to Mastery
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
