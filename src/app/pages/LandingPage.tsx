import { Link } from 'react-router';
import { Logo } from '../components/Logo';
import {
  Building2,
  Users,
  Package,
  Calculator,
  TrendingUp,
  Wallet,
  BarChart3,
  ArrowRight,
  MessageCircle,
  DollarSign,
  Zap,
  ChevronDown,
  Sparkles,
  Shield,
  Infinity,
  Lock,
  Globe,
  Target,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const whatsappNumber = '5592994764780';
  const whatsappMessage = 'Olá! Gostaria de conhecer o SisFinance.';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)',
            left: `${mousePosition.x - 400}px`,
            top: `${mousePosition.y - 400}px`,
            transition: 'all 0.3s ease-out',
          }}
        />
        <div className="absolute top-20 right-20 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-[#050505]/80 backdrop-blur-xl border-b border-white/5' 
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-6">
            <a 
              href="#recursos" 
              className="hidden md:block text-sm font-medium text-gray-400 hover:text-emerald-400 transition-colors tracking-wide"
            >
              RECURSOS
            </a>
            <a 
              href="#planos" 
              className="hidden md:block text-sm font-medium text-gray-400 hover:text-purple-400 transition-colors tracking-wide"
            >
              PLANOS
            </a>
            <Link 
              to="/login"
              className="hidden sm:block text-sm font-medium text-gray-400 hover:text-emerald-400 transition-colors tracking-wide"
            >
              ENTRAR
            </Link>
            <button className="group relative px-6 py-2.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-purple-500 rounded-full font-semibold text-sm overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]">
              <Link to="/app" className="relative z-10 flex items-center gap-2">
                ACESSAR SISTEMA
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 overflow-hidden">
        {/* 3D Floating Abstract Graphics */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-full h-full max-w-4xl">
            {/* Floating Glass Cards */}
            <div 
              className="absolute top-1/4 right-1/4 w-48 h-48 glass-card animate-float"
              style={{ animationDelay: '0s' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-3xl" />
              <div className="absolute inset-[1px] bg-[#0a0a0a]/40 backdrop-blur-xl rounded-3xl border border-white/10" />
            </div>
            
            <div 
              className="absolute top-1/3 left-1/4 w-64 h-64 glass-card animate-float"
              style={{ animationDelay: '1s' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent rounded-3xl" />
              <div className="absolute inset-[1px] bg-[#0a0a0a]/40 backdrop-blur-xl rounded-3xl border border-white/10" />
            </div>

            <div 
              className="absolute bottom-1/4 right-1/3 w-56 h-56 glass-card animate-float"
              style={{ animationDelay: '2s' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-3xl" />
              <div className="absolute inset-[1px] bg-[#0a0a0a]/40 backdrop-blur-xl rounded-3xl border border-white/10" />
            </div>

            {/* Neon Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="neonGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="neonPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 100 200 Q 300 100 500 200" stroke="url(#neonGreen)" strokeWidth="2" fill="none" className="animate-pulse" />
              <path d="M 200 300 Q 400 250 600 350" stroke="url(#neonPurple)" strokeWidth="2" fill="none" className="animate-pulse" style={{ animationDelay: '1s' }} />
            </svg>
          </div>
        </div>

        <div className="relative z-10 container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-8">
            <Sparkles className="size-4 text-emerald-400" />
            <span className="text-sm font-medium tracking-wider text-gray-300">SISTEMA DE GESTÃO FINANCEIRA</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight leading-[0.9]">
            <span className="block text-white">GESTÃO</span>
            <span className="block bg-gradient-to-r from-emerald-400 via-emerald-300 to-purple-400 bg-clip-text text-transparent">
              FINANCEIRA
            </span>
            <span className="block text-white/90">PREMIUM</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            Sistema multientidade de alta performance para controle total de <span className="text-emerald-400">caixa</span>, <span className="text-purple-400">funcionários</span> e <span className="text-cyan-400">estoque</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl font-bold text-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] hover:scale-105">
              <Link to="/app" className="relative z-10 flex items-center gap-3">
                <Zap className="size-6" />
                COMEÇAR AGORA
              </Link>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all duration-300 hover:border-emerald-400/50 flex items-center gap-3"
            >
              <MessageCircle className="size-6 text-emerald-400" />
              FALE CONOSCO
            </a>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-emerald-400" />
              SEGURO
            </div>
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-purple-400" />
              CLOUD
            </div>
            <div className="flex items-center gap-2">
              <Infinity className="size-4 text-cyan-400" />
              ESCALÁVEL
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="size-8 text-gray-600" />
          </div>
        </div>
      </section>

      {/* Features Bentogrid */}
      <section id="recursos" className="relative py-32 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
                RECURSOS PREMIUM
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Tecnologia de ponta para gestão empresarial completa
            </p>
          </div>

          {/* Asymmetric Bentogrid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
            {/* Large Feature - Top Left */}
            <div className="lg:col-span-2 lg:row-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-8 hover:border-emerald-400/50 transition-all duration-500 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <Building2 className="size-8 text-white" />
                </div>
                <h3 className="text-3xl font-black mb-4 tracking-tight">MULTIENTIDADE</h3>
                <p className="text-gray-400 text-lg leading-relaxed mb-6">
                  Gerencie múltiplas empresas e unidades com separação total de contas e dados isolados por entidade
                </p>
                
                {/* Mini Stats */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                    <div className="text-2xl font-bold text-emerald-400">∞</div>
                    <div className="text-xs text-gray-500 mt-1">Empresas</div>
                  </div>
                  <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                    <div className="text-2xl font-bold text-purple-400">100%</div>
                    <div className="text-xs text-gray-500 mt-1">Isolamento</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medium Feature - Top Right */}
            <div className="lg:col-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-8 hover:border-purple-400/50 transition-all duration-500 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-purple-500/20 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                    <Users className="size-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-black mb-3 tracking-tight">FUNCIONÁRIOS</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Gestão completa de funcionários com gorjetas, diárias e comissões automatizadas
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-4xl font-black bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    24/7
                  </div>
                  <div className="text-xs text-gray-500 mt-1">MONITORAMENTO</div>
                </div>
              </div>
            </div>

            {/* Small Features */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-6 hover:border-cyan-400/50 transition-all duration-500 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  <Package className="size-6 text-white" />
                </div>
                <h3 className="text-lg font-black mb-2 tracking-tight">ESTOQUE</h3>
                <p className="text-sm text-gray-400">Valor imobilizado em tempo real</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-6 hover:border-orange-400/50 transition-all duration-500 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                  <Calculator className="size-6 text-white" />
                </div>
                <h3 className="text-lg font-black mb-2 tracking-tight">CAIXA</h3>
                <p className="text-sm text-gray-400">Fechamento diário integrado</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-6 hover:border-indigo-400/50 transition-all duration-500 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  <Wallet className="size-6 text-white" />
                </div>
                <h3 className="text-lg font-black mb-2 tracking-tight">CONTAS</h3>
                <p className="text-sm text-gray-400">Rastreamento obrigatório</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-6 hover:border-pink-400/50 transition-all duration-500 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                  <BarChart3 className="size-6 text-white" />
                </div>
                <h3 className="text-lg font-black mb-2 tracking-tight">ANALYTICS</h3>
                <p className="text-sm text-gray-400">Dashboard em tempo real</p>
              </div>
            </div>

            {/* Wide Feature - Bottom */}
            <div className="lg:col-span-4 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-8 hover:border-emerald-400/50 transition-all duration-500 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                      <TrendingUp className="size-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">VISUALIZAÇÃO DE DADOS PREMIUM</h3>
                      <p className="text-gray-500 text-sm">Gráficos interativos com transparência e linhas neon</p>
                    </div>
                  </div>
                  <p className="text-gray-400 leading-relaxed">
                    Dashboards em tempo real com visualizações sofisticadas de saldos por conta, capital imobilizado em estoque e capital total consolidado
                  </p>
                </div>
                
                {/* Mini Chart Visualization */}
                <div className="flex items-end gap-2 h-24">
                  {[40, 70, 50, 90, 60, 80, 55].map((height, i) => (
                    <div 
                      key={i}
                      className="w-8 rounded-t-lg bg-gradient-to-t from-emerald-500/50 to-purple-500/50 border border-white/10 backdrop-blur-sm relative group-hover:from-emerald-400 group-hover:to-purple-400 transition-all duration-500"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-400/0 to-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '99.9%', label: 'Uptime', color: 'emerald' },
              { value: '<50ms', label: 'Resposta', color: 'purple' },
              { value: '24/7', label: 'Suporte', color: 'cyan' },
              { value: '∞', label: 'Escalável', color: 'pink' },
            ].map((stat, i) => (
              <div key={i} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 text-center backdrop-blur-xl hover:border-white/20 transition-all duration-500">
                  <div className={`text-4xl font-black mb-2 bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-600 bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 font-medium tracking-wider">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="relative py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
                PLANOS PREMIUM
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Escolha a solução perfeita para o seu negócio
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'STARTER',
                price: 'Consulte',
                description: 'Para pequenos negócios',
                features: ['1 Empresa', 'Até 5 Usuários', 'Módulos Essenciais', 'Suporte Email'],
                color: 'cyan',
              },
              {
                name: 'PROFESSIONAL',
                price: 'Consulte',
                description: 'Para empresas em crescimento',
                features: ['Até 3 Empresas', 'Usuários Ilimitados', 'Todos os Módulos', 'Suporte Prioritário', 'Relatórios Avançados'],
                color: 'emerald',
                featured: true,
              },
              {
                name: 'ENTERPRISE',
                price: 'Personalizado',
                description: 'Para grandes operações',
                features: ['Empresas Ilimitadas', 'Multi-usuário', 'Customizações', 'Suporte 24/7', 'Consultoria', 'API'],
                color: 'purple',
              },
            ].map((plan, i) => (
              <div 
                key={i}
                className={`relative group ${plan.featured ? 'md:-mt-4 md:scale-105' : ''}`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full text-xs font-black tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.6)]">
                      POPULAR
                    </div>
                  </div>
                )}
                
                <div className={`absolute inset-0 bg-gradient-to-br ${
                  plan.featured 
                    ? 'from-emerald-500/20 to-purple-500/20' 
                    : 'from-white/5 to-white/[0.02]'
                } rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500`} />
                
                <div className={`relative bg-gradient-to-br from-white/5 to-white/[0.02] border ${
                  plan.featured 
                    ? 'border-emerald-400/50 shadow-[0_0_40px_rgba(16,185,129,0.2)]' 
                    : 'border-white/10'
                } rounded-3xl p-8 backdrop-blur-xl hover:border-white/20 transition-all duration-500`}>
                  <div className="mb-6">
                    <h3 className="text-2xl font-black mb-2 tracking-tight">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </div>

                  <div className="mb-8">
                    <div className={`text-5xl font-black bg-gradient-to-r from-${plan.color}-400 to-${plan.color}-600 bg-clip-text text-transparent`}>
                      {plan.price}
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-r from-${plan.color}-500 to-${plan.color}-600 flex items-center justify-center flex-shrink-0`}>
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block w-full py-3 rounded-2xl font-bold text-center transition-all duration-300 ${
                      plan.featured
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-105'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    SOLICITAR PROPOSTA
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-purple-500/20 to-cyan-500/20 blur-3xl" />
        
        <div className="relative container mx-auto max-w-4xl text-center">
          <div className="relative bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-12 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-purple-500/10 rounded-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
                PRONTO PARA
                <span className="block bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
                  TRANSFORMAR
                </span>
                SEU NEGÓCIO?
              </h2>
              
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                Junte-se às empresas que já revolucionaram sua gestão financeira
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl font-bold text-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] hover:scale-105">
                  <Link to="/app" className="relative z-10 flex items-center gap-3">
                    <Target className="size-6" />
                    COMEÇAR AGORA
                  </Link>
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all duration-300 flex items-center gap-3"
                >
                  <MessageCircle className="size-6 text-emerald-400" />
                  FALAR COM ESPECIALISTA
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="sm" />
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#recursos" className="hover:text-emerald-400 transition-colors">Recursos</a>
              <a href="#planos" className="hover:text-purple-400 transition-colors">Planos</a>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
                Contato
              </a>
            </div>

            <div className="text-sm text-gray-500">
              © 2024 SisFinance. Premium Financial System.
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-[0_0_40px_rgba(34,197,94,0.6)] flex items-center justify-center hover:scale-110 transition-all duration-300 z-50 group"
        aria-label="Fale conosco no WhatsApp"
      >
        <MessageCircle className="size-8 text-white group-hover:scale-110 transition-transform" />
        <div className="absolute inset-0 rounded-full bg-green-400/50 animate-ping opacity-75" />
      </a>
    </div>
  );
}