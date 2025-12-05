import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, AlertTriangle, Layers, LayoutTemplate, X, CheckCircle2, BrainCircuit, Network, ShieldCheck, Target, Cpu, Zap } from 'lucide-react';
import KineticMesh from '@/components/landing/KineticMesh';
import supabase from '@/services/supabaseClient';
import { logger } from '@/utils/logger';
import heroImage from '@/images/imageq1_lay.png';
import heroImage2 from '@/images/icon.png';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = React.useState('');
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Reset modal state when opening
  React.useEffect(() => {
    if (isOpen) {
      setEmail('');
      setIsSubmitted(false);
      setIsLoading(false);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: supabaseError } = await supabase
        .from('v1_waitlist')
        .insert([{ email: email.toLowerCase().trim() }])
        .select();

      if (supabaseError) {
        if (supabaseError.code === '23505') {
          setError('Este correo ya está registrado en nuestra lista de espera.');
          return;
        }
        logger.error('Error de Supabase:', supabaseError);
        throw new Error(supabaseError.message || 'Error al guardar en la base de datos');
      }

      logger.log('Correo registrado exitosamente:', data);
      setIsSubmitted(true);

    } catch (err) {
      logger.error('Error al registrar correo:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Hubo un problema al registrar tu correo. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-6 md:p-8 rounded-2xl max-w-md w-full mx-auto shadow-2xl border border-gray-100"
      >
        {!isSubmitted ? (
          <div>
            <div className="text-center mb-6">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Lista de Espera: MindOps v1.0
              </h3>
              <p className="text-gray-600 text-sm md:text-base">
                Déjanos tu correo y serás el primero en saber cuándo nuestra versión comercial esté lista.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#2383e2] focus:border-transparent transition-colors ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  disabled={isLoading}
                  required
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors duration-300"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className={`flex-1 font-semibold py-3 px-4 rounded-xl transition-colors duration-300 flex items-center justify-center ${isLoading || !email
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#2383e2] text-white hover:bg-[#1d6ab8] shadow-lg hover:shadow-xl'
                    }`}
                >
                  {isLoading ? 'Registrando...' : 'Registrarme'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                ¡Excelente! 🎉
              </h3>
              <p className="text-gray-600">
                Te hemos añadido a la lista.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-[#2383e2] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#1d6ab8] transition-colors shadow-lg"
            >
              Cerrar
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState('layer-3');
  const [hoveredSiaSection, setHoveredSiaSection] = useState<string | null>(null);

  const getOpacity = (section: string) => hoveredSiaSection && hoveredSiaSection !== section ? 0.2 : 1;

  return (
    <div className="bg-white font-sans w-full min-h-screen flex flex-col">

      {/* --- HERO SECTION --- */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden pt-15 bg-black">
        <KineticMesh />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto space-y-3">
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0 }}
            className="flex flex-col items-center"
          >

            <h1 className="text-5xl md:text-7xl font-extralight text-white tracking-tight leading-[1.1] mb-6">
              IA diseñada como un sistema, no como un parche.
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0 }}
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
          >
            Pasamos de la optimización ciega a la viabilidad real: inteligencia que valida tus decisiones en el mundo físico.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex items-center justify-center pt-8"
          >
            <a href="/beta-application" className="px-8 py-4 bg-[#2383e2] text-white rounded-2xl font-bold text-lg hover:bg-[#1d6ab8] transition-all shadow-lg hover:shadow-blue-200 hover:-translate-y-1 flex items-center gap-2">
              Acceso Beta <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section >

      {/* --- BLOQUE 2: LA TRAMPA ARQUITECTÓNICA (ACORDEÓN HORIZONTAL) --- */}
      <section id="investigacion" className="relative w-full py-24 px-4 md:px-8 lg:px-16 z-10 overflow-hidden bg-white">

        {/* BACKGROUND AMBIENTAL ANIMADO */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-100/30 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-50/40 rounded-full blur-[100px]" style={{ animation: 'pulse 12s ease-in-out infinite' }}></div>
          {/* Grid Pattern Sutil */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(to right, #0f172a 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        {/* Gradient Background Subtle */}
        <div className="absolute inset-0 bg-white pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">

          {/* HEADER */}
          <div className="mb-12 text-center">
            <div className="w-12 h-1 bg-gradient-to-r from-[#2383e2] to-blue-300 mx-auto mb-6 rounded-full"></div>
            <h2 className="text-4xl md:text-6xl font-extralight mb-4 text-slate-900">
              La Trampa <span className="text-[#2383e2]">Arquitectónica</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              El 90% falla en la ejecución. No es un problema de potencia, es un problema de estructura.
            </p>
          </div>

          {/* ACORDEÓN HORIZONTAL */}
          <div className="flex flex-col lg:flex-row gap-4 min-h-[600px] lg:min-h-[500px]">

            {/* CARD 1: SÍNTOMAS */}
            <div className="group flex-1 lg:hover:flex-[3] transition-all duration-700 ease-out">
              <div className="relative h-full bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/60 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-blue-100/20 group-hover:border-[#2383e2]/30 group-hover:bg-white overflow-hidden">

                {/* Decorative corner gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-full"></div>

                {/* Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-blue-50/80 backdrop-blur-sm text-[#2383e2] text-xs font-bold uppercase rounded-full border border-blue-100">
                  Síntomas
                </div>

                <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 text-[#2383e2] rounded-2xl w-fit">
                  <AlertTriangle className="w-6 h-6 lg:w-8 lg:h-8" />
                </div>

                <h3 className="text-xl lg:text-2xl font-extralight mb-2 text-slate-900">Síntomas de Deuda Arquitectónica</h3>
                <p className="text-xs font-mono text-slate-400 mb-4 uppercase tracking-wider">"El costo de no escalar"</p>

                {/* Contenido expandido - solo visible en hover */}
                <div className="opacity-0 max-h-0 lg:group-hover:opacity-100 lg:group-hover:max-h-[500px] transition-all duration-700 overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                      <div className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">90<span className="text-[#2383e2]">%</span></div>
                      <p className="font-bold text-slate-800 text-sm">Inversión sin Retorno</p>
                      <p className="text-xs text-slate-600 leading-relaxed">De las empresas aumentan su presupuesto de IA, pero reportan que el ROI sigue siendo "esquivo".</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">80<span className="text-[#2383e2]">%</span></div>
                      <p className="font-bold text-slate-800 text-sm">Fallo en Producción</p>
                      <p className="text-xs text-slate-600 leading-relaxed">De los proyectos mueren antes de salir. Los "Silos de Datos" impiden el contexto necesario.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: EL ERROR */}
            <div className="group flex-1 lg:hover:flex-[3] transition-all duration-700 ease-out">
              <div className="relative h-full bg-white rounded-3xl p-8 border border-slate-200/60 shadow-sm transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-slate-200/50 overflow-hidden">

                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(148, 163, 184, 0.05) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

                {/* Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold uppercase rounded-full border border-slate-200">
                  Innovación de Componentes
                </div>

                <div className="mb-4 p-3 bg-slate-100 text-slate-500 rounded-2xl w-fit relative z-10">
                  <Layers className="w-6 h-6 lg:w-8 lg:h-8" />
                </div>

                <h3 className="text-xl lg:text-2xl font-extralight mb-2 text-slate-900 relative z-10">El Error: Superponer Tecnología</h3>
                <p className="text-xs font-mono text-slate-400 mb-4 uppercase tracking-wider relative z-10">"Motor nuevo, estructura vieja"</p>

                {/* Contenido expandido - solo visible en hover */}
                <div className="opacity-0 max-h-0 lg:group-hover:opacity-100 lg:group-hover:max-h-[500px] transition-all duration-700 overflow-hidden">
                  <p className="text-slate-600 mb-4 leading-relaxed relative z-10 text-sm">
                    Insertar IA en departamentos aislados es como <strong className="text-slate-900 bg-slate-100 px-1 rounded">electrificar una máquina de vapor</strong> sin quitar las poleas.
                  </p>

                  <ul className="space-y-2 relative z-10">
                    <li className="flex items-start gap-2 text-xs text-slate-600">
                      <X className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      "Shadow AI" Descontrolado
                    </li>
                    <li className="flex items-start gap-2 text-xs text-slate-600">
                      <X className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      Alucinaciones por falta de contexto
                    </li>
                    <li className="flex items-start gap-2 text-xs text-slate-600">
                      <X className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      Ley de Conway (El software copia la burocracia)
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CARD 3: LA SOLUCIÓN */}
            <div className="group flex-1 lg:hover:flex-[3] transition-all duration-700 ease-out">
              <div className="relative h-full bg-black text-white rounded-3xl p-8 border border-slate-800/50 shadow-2xl transition-all duration-500 group-hover:shadow-white/10 group-hover:border-white/20 overflow-hidden">

                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                {/* Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-[#2383e2]/20 text-blue-300 border border-[#2383e2]/40 text-xs font-bold uppercase rounded-full backdrop-blur-sm">
                  Innovación Arquitectónica
                </div>

                <div className="mb-4 p-3 bg-gradient-to-br from-[#2383e2] to-blue-600 text-white rounded-2xl w-fit relative z-10 shadow-lg shadow-blue-500/20">
                  <LayoutTemplate className="w-6 h-6 lg:w-8 lg:h-8" />
                </div>

                <h3 className="text-xl lg:text-2xl font-extralight mb-2 relative z-10">La Solución: Rediseño de Flujo</h3>
                <p className="text-xs font-mono text-blue-400 mb-4 uppercase tracking-wider relative z-10">"Construir la nueva infraestructura"</p>

                {/* Contenido expandido - solo visible en hover */}
                <div className="opacity-0 max-h-0 lg:group-hover:opacity-100 lg:group-hover:max-h-[500px] transition-all duration-700 overflow-hidden">
                  <p className="text-slate-300 mb-4 leading-relaxed relative z-10 text-sm">
                    Mindgrate presenta una nueva categoría tecnológica: El Systemic Intelligence Architecture (SIA). No es solo software, es una infraestructura de gobernanza diseñada para que las organizaciones operen como sistemas vivos y coherentes.
                  </p>

                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 relative z-10">
                    <div className="flex items-center gap-3 mb-1">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="font-bold text-sm">Coherencia Sistémica</span>
                    </div>
                    <p className="text-xs text-slate-400 pl-8">
                      El marco permite que la eficiencia digital no canibalice la viabilidad física de la organización. Es la transición fundamental a una IA Regenerativa..
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Hint de interacción */}
          <div className="mt-8 text-center">

          </div>

        </div>

      </section>


      {/* --- BLOQUE 3: SIA SYSTEM (Fondo Blanco) --- */}
      <section id="sia" className="relative py-24 overflow-hidden bg-white">

        {/* Elementos de fondo sutiles */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">

          {/* HEADER DEL BLOQUE */}
          <div className="text-center mb-20">
            <span className="text-[#2383e2] font-bold tracking-wider uppercase text-sm mb-2 block">La Nueva Infraestructura</span>
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 text-gray-900">
              Mindgrate <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2383e2] to-blue-400">SIA</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              Systemic Intelligence Architecture: Una gobernanza cognitiva que integra inteligencia, operación y ética en un solo sistema vivo.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-16">

            {/* COLUMNA IZQUIERDA: EL DIAGRAMA ANIMADO (SVG) */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="relative w-[400px] h-[400px] md:w-[500px] md:h-[500px]">

                {/* SVG SIA SYSTEM */}
                <svg viewBox="0 0 600 600" className="w-full h-full drop-shadow-2xl">
                  {/* Definiciones de Gradientes */}
                  <defs>
                    <linearGradient id="gradCore" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#2383e2', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#1d4ed8', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>

                  {/* 3. GOVERNANCE LAYER (Anillo Exterior - Viabilidad) */}
                  <g className="sia-ring-outer" style={{ transition: 'opacity 0.3s', opacity: getOpacity('governance') }}>
                    {/* El anillo fragmentado que representa el filtro ético - AMPLIADO */}
                    <circle cx="300" cy="300" r="300" fill="none" stroke="#22c92fff" strokeWidth="2" strokeDasharray="20 40" opacity="0.3" />
                    <circle cx="300" cy="300" r="290" fill="none" stroke="#08962cff" strokeWidth="1" strokeDasharray="10 10" opacity="0.2" />
                    {/* Icono de escudo orbitando (Simulado con un punto) */}
                    <circle cx="430" cy="30" r="4" fill="#3bc251ff" />
                    <circle cx="430" cy="570" r="4" fill="#3bc251ff" />
                  </g>

                  <g style={{ transition: 'opacity 0.3s', opacity: getOpacity('mindops') }}>
                    {/* NUEVO: Anillo de Conexión MindOps */}
                    <circle cx="300" cy="300" r="142" fill="none" stroke="#2383e2" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />

                    {/* 2. MINDOPS LAYER (Red Intermedia) */}
                    <g>
                      {/* Conexiones de datos fluyendo hacia el centro */}
                      <line x1="300" y1="300" x2="200" y2="200" stroke="#2383e2" strokeWidth="2" opacity="0.4" className="sia-connection" />
                      <line x1="300" y1="300" x2="400" y2="200" stroke="#2383e2" strokeWidth="2" opacity="0.4" className="sia-connection" />
                      <line x1="300" y1="300" x2="200" y2="400" stroke="#2383e2" strokeWidth="2" opacity="0.4" className="sia-connection" />
                      <line x1="300" y1="300" x2="400" y2="400" stroke="#2383e2" strokeWidth="2" opacity="0.4" className="sia-connection" />

                      {/* NUEVO: Conexiones a Nodos Humanos */}
                      <line x1="200" y1="200" x2="120" y2="120" stroke="#2383e2" strokeWidth="1" opacity="0.3" />
                      <line x1="400" y1="200" x2="480" y2="120" stroke="#2383e2" strokeWidth="1" opacity="0.3" />
                      <line x1="200" y1="400" x2="120" y2="480" stroke="#2383e2" strokeWidth="1" opacity="0.3" />
                      <line x1="400" y1="400" x2="480" y2="480" stroke="#2383e2" strokeWidth="1" opacity="0.3" />

                      {/* Nodo 1: OPERACIONES */}
                      <g className="group">
                        <circle cx="200" cy="200" r="18" fill="#ffffffff" stroke="#2383e2" strokeWidth="2" />
                        <text x="200" y="205" textAnchor="middle" fontSize="9" fill="#2383e2" fontFamily="monospace" fontWeight="bold">OPS</text>
                        <text x="200" y="235" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif" className="sia-label">Operaciones</text>
                      </g>
                      {/* Nodo Humano 1 */}
                      <g className="group">
                        <circle cx="120" cy="120" r="14" fill="#f0f9ff" stroke="#2383e2" strokeWidth="1" />
                        <g transform="translate(111, 111) scale(0.75)">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#2383e2" />
                        </g>
                      </g>


                      {/* Nodo 2: FINANZAS */}
                      <g className="group">
                        <circle cx="400" cy="200" r="18" fill="#ffffffff" stroke="#2383e2" strokeWidth="2" />
                        <text x="400" y="205" textAnchor="middle" fontSize="9" fill="#2383e2" fontFamily="monospace" fontWeight="bold">FIN</text>
                        <text x="400" y="235" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif" className="sia-label">Finanzas</text>
                      </g>
                      {/* Nodo Humano 2 */}
                      <g className="group">
                        <circle cx="480" cy="120" r="14" fill="#f0f9ff" stroke="#2383e2" strokeWidth="1" />
                        <g transform="translate(471, 111) scale(0.75)">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#2383e2" />
                        </g>
                      </g>

                      {/* Nodo 3: LEGAL */}
                      <g className="group">
                        <circle cx="200" cy="400" r="18" fill="#ffffffff" stroke="#2383e2" strokeWidth="2" />
                        <text x="200" y="405" textAnchor="middle" fontSize="9" fill="#2383e2" fontFamily="monospace" fontWeight="bold">LEG</text>
                        <text x="200" y="435" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif" className="sia-label">Legal</text>
                      </g>
                      {/* Nodo Humano 3 */}
                      <g className="group">
                        <circle cx="120" cy="480" r="14" fill="#f0f9ff" stroke="#2383e2" strokeWidth="1" />
                        <g transform="translate(111, 471) scale(0.75)">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#2383e2" />
                        </g>
                      </g>

                      {/* Nodo 4: TALENTO */}
                      <g className="group">
                        <circle cx="400" cy="400" r="18" fill="#ffffffff" stroke="#2383e2" strokeWidth="2" />
                        <text x="400" y="405" textAnchor="middle" fontSize="9" fill="#2383e2" fontFamily="monospace" fontWeight="bold">TAL</text>
                        <text x="400" y="435" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif" className="sia-label">Talento</text>
                      </g>
                      {/* Nodo Humano 4 */}
                      <g className="group">
                        <circle cx="480" cy="480" r="14" fill="#f0f9ff" stroke="#2383e2" strokeWidth="1" />
                        <g transform="translate(471, 471) scale(0.75)">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#2383e2" />
                        </g>
                      </g>
                    </g>
                  </g>

                  {/* 1. DYNAMIC PROJECT CORE (Centro) */}
                  <g style={{ transition: 'opacity 0.3s', opacity: getOpacity('dpc') }}>
                    <circle cx="300" cy="300" r="40" fill="url(#gradCore)" className="sia-core" />
                    <text x="300" y="305" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">DPC</text>

                    {/* Anillo interior rotando */}
                    <circle cx="300" cy="300" r="55" fill="none" stroke="#2383e2" strokeWidth="1" strokeDasharray="5 5" opacity="0.5" className="sia-ring-inner" />
                  </g>

                </svg>

                {/* Etiquetas Flotantes */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-10   bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-300 backdrop-blur-sm">
                  Governance Core
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: EXPLICACIÓN (Cards Interactivos) */}
            <div className="w-full lg:w-1/2 space-y-6">

              {/* Componente 1: DPC */}
              <div
                className="group relative bg-slate-50 p-6 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-[#2383e2] transition-all duration-300"
                onMouseEnter={() => setHoveredSiaSection('dpc')}
                onMouseLeave={() => setHoveredSiaSection(null)}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2383e2] rounded-l-xl"></div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-[#2383e2]/10 rounded-lg text-[#2383e2] group-hover:scale-110 transition-transform">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extralight text-gray-900 mb-1">Dynamic Project Core (DPC)</h3>
                    <p className="text-xs font-bold text-[#2383e2] uppercase tracking-widest mb-2">El Núcleo Cognitivo</p>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      El <strong>DPC</strong> es el motor cognitivo que traduce la estrategia de alto nivel en parámetros operativos ajustados en tiempo real. Su valor reside en la Simulación de Viabilidad , que permite mitigar el riesgo al evaluar el impacto sistémico de las decisiones antes de su ejecución.
                    </p>
                  </div>
                </div>
              </div>

              {/* Componente 2: MindOps */}
              <div
                className="group relative bg-slate-50 p-6 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-[#2383e2] transition-all duration-300"
                onMouseEnter={() => setHoveredSiaSection('mindops')}
                onMouseLeave={() => setHoveredSiaSection(null)}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2383e2] rounded-l-xl"></div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-[#2383e2]/10 rounded-lg text-[#2383e2] group-hover:scale-110 transition-transform">
                    <Network className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extralight text-gray-900 mb-1">MindOps + Systemic Intelligence Architecture Framework (SIAF)</h3>
                    <p className="text-xs font-bold text-[#2383e2] uppercase tracking-widest mb-2">La Red Operativa</p>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      <strong></strong>Los MindOps son asistentes de IA especializados <strong>(por departamento)</strong> que ejecutan automáticamente su trabajo diario, eliminando la microgestión. <strong></strong>El SIAF es el método que enseña a los equipos humanos y a los agentes a pensar y actuar en red<strong></strong>, garantizando la coordinación.
                    </p>
                  </div>
                </div>
              </div>

              {/* Componente 3: Governance (TEXTO ACTUALIZADO AQUÍ) */}
              <div
                className="group relative bg-slate-50 p-6 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-[#2383e2] transition-all duration-300"
                onMouseEnter={() => setHoveredSiaSection('governance')}
                onMouseLeave={() => setHoveredSiaSection(null)}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2383e2] rounded-l-xl"></div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-[#2383e2]/10 rounded-lg text-[#2383e2] group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extralight text-gray-900 mb-1">Governance Core</h3>
                    <p className="text-xs font-bold text-[#2383e2] uppercase tracking-widest mb-2">Coste Material & Regeneración</p>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      <strong>El Filtro Ético que Cuida su Futuro:</strong> Mindgrate opera bajo una regla simple: una decisión no es inteligente si destruye lo que la sostiene (sus recursos naturales, la energía de su equipo, la salud mental).
                      <br /><br />
                      <strong>IA Regenerativa:</strong> Esto nos hace pasar de una IA que solo busca sacar el máximo provecho <strong>(extractiva)</strong> a una IA que ayuda a construir y cuidar las condiciones que permiten el éxito a largo plazo <strong>(regenerativa)</strong>.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* --- BLOQUE 5: ARQUITECTURA DE MATERIALIDAD --- */}
      <section id="layers" className="relative py-24 px-6 lg:px-12 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">

          {/* Header Simple */}
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-[#2383e2] uppercase mb-2 block">La Visión Fundacional</span>
            <h2 className="text-4xl md:text-5xl font-extralight text-slate-900">
              Diseñando para la Sostenibilidad Real
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            {/* COLUMNA IZQUIERDA: DIAGRAMA (5 cols) */}
            <div className="lg:col-span-5 flex justify-center relative lg:sticky lg:top-32">
              {/* Fondo sutil */}
              <div className="absolute inset-0 bg-white rounded-full opacity-50 blur-3xl transform scale-150"></div>

              <svg viewBox="0 0 300 500" className="w-full max-w-[320px] h-auto drop-shadow-lg relative z-10">

                {/* LINEA CONECTORA (La columna vertebral) */}
                <line x1="150" y1="60" x2="150" y2="440" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />

                {/* SEÑALES ANIMADAS (El flujo de información) */}
                <circle cx="150" cy="60" r="6" className="signal-dot-down" />
                <circle cx="150" cy="60" r="6" className="signal-dot-up" />

                {/* CAPA 3: ESTRATÉGICA */}
                <g className={`svg-layer ${selectedLayer !== 'layer-3' ? 'inactive' : ''}`} onClick={() => setSelectedLayer('layer-3')} style={{ cursor: 'pointer' }}>
                  <line x1="150" y1="100" x2="90" y2="100" stroke="#94a3b8" strokeWidth="2" />
                  <rect x="20" y="70" width="140" height="60" rx="12" fill="white" stroke={selectedLayer === 'layer-3' ? '#2383e2' : '#e2e8f0'} strokeWidth={selectedLayer === 'layer-3' ? '2' : '1'} />
                  <text x="90" y="105" fontFamily="Inter" fontSize="12" fontWeight="bold" fill="#1e293b" textAnchor="middle">ESTRATEGIA</text>
                  <text x="90" y="120" fontFamily="Inter" fontSize="9" fill="#64748b" textAnchor="middle">Intención</text>
                  <circle cx="150" cy="100" r="4" fill="#2383e2" className="connection-point" />
                </g>

                {/* CAPA 2: OPERATIVA */}
                <g className={`svg-layer ${selectedLayer !== 'layer-2' ? 'inactive' : ''}`} onClick={() => setSelectedLayer('layer-2')} style={{ cursor: 'pointer' }}>
                  <line x1="150" y1="250" x2="210" y2="250" stroke="#94a3b8" strokeWidth="2" />
                  <rect x="140" y="220" width="140" height="60" rx="12" fill="white" stroke={selectedLayer === 'layer-2' ? '#2383e2' : '#e2e8f0'} strokeWidth={selectedLayer === 'layer-2' ? '2' : '1'} />
                  <text x="210" y="255" fontFamily="Inter" fontSize="12" fontWeight="bold" fill="#1e293b" textAnchor="middle">OPERATIVA</text>
                  <text x="210" y="270" fontFamily="Inter" fontSize="9" fill="#64748b" textAnchor="middle">Estructura</text>
                  <circle cx="150" cy="250" r="4" fill="#2383e2" className="connection-point" style={{ animationDelay: '0.5s' }} />
                </g>

                {/* CAPA 1: TÁCTICA */}
                <g className={`svg-layer ${selectedLayer !== 'layer-1' ? 'inactive' : ''}`} onClick={() => setSelectedLayer('layer-1')} style={{ cursor: 'pointer' }}>
                  <line x1="150" y1="400" x2="90" y2="400" stroke="#94a3b8" strokeWidth="2" />
                  <rect x="20" y="370" width="140" height="60" rx="12" fill="white" stroke={selectedLayer === 'layer-1' ? '#2383e2' : '#e2e8f0'} strokeWidth={selectedLayer === 'layer-1' ? '2' : '1'} />
                  <text x="90" y="405" fontFamily="Inter" fontSize="12" fontWeight="bold" fill="#1e293b" textAnchor="middle">TÁCTICA</text>
                  <text x="90" y="420" fontFamily="Inter" fontSize="9" fill="#64748b" textAnchor="middle">Trabajo</text>
                  <circle cx="150" cy="400" r="4" fill="#2383e2" className="connection-point" style={{ animationDelay: '1s' }} />
                </g>

              </svg>
            </div>

            {/* COLUMNA DERECHA: EXPLICACIÓN (7 cols) */}
            <div className="lg:col-span-7 space-y-8">

              {/* Card 3: Estratégica */}
              <div
                id="layer-3"
                className={`layer-card p-8 rounded-2xl cursor-pointer group ${selectedLayer === 'layer-3' ? 'active' : ''}`}
                onMouseEnter={() => setSelectedLayer('layer-3')}
              >
                <div className="flex gap-5">
                  <div className="mt-1 p-2 bg-blue-50 rounded-lg text-[#2383e2] group-hover:scale-110 transition-transform h-fit">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extralight text-slate-900 mb-2">El "Por Qué" de nuestras acciones</h3>
                    <p className="text-slate-600 text-base leading-relaxed">
                      Si la tecnología se encarga del "cómo" (la velocidad), nosotros nos encargamos del "por qué" (el sentido). En esta capa, definimos qué significa realmente tener éxito. No se trata solo de hacerlo rápido, sino de hacerlo bien: cuidando a la gente y los recursos. Aquí es donde la voluntad humana guía a la inteligencia del sistema, asegurando que nunca perdamos el norte por perseguir la eficiencia ciega.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Operativa + SIAF */}
              <div
                id="layer-2"
                className={`layer-card p-8 rounded-2xl cursor-pointer group ${selectedLayer === 'layer-2' ? 'active' : ''}`}
                onMouseEnter={() => setSelectedLayer('layer-2')}
              >
                <div className="flex gap-5">
                  <div className="mt-1 p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-blue-50 group-hover:text-[#2383e2] transition-colors h-fit">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extralight text-slate-900 mb-2">Nuestro Manual Vivo</h3>
                    <p className="text-slate-600 text-base leading-relaxed mb-4">
                      Aquí es donde reside el "cómo" hacemos las cosas. Es el espacio donde aprendemos a operar como una red y no como islas aisladas. En lugar de recibir órdenes ciegas, esta capa convierte la estrategia de la empresa en protocolos claros y útiles que nos ayudan a tomar decisiones autónomas, sabiendo que estamos alineados con el resto de la organización.
                    </p>


                  </div>
                </div>
              </div>

              {/* Card 1: Táctica */}
              <div
                id="layer-1"
                className={`layer-card p-8 rounded-2xl cursor-pointer group ${selectedLayer === 'layer-1' ? 'active' : ''}`}
                onMouseEnter={() => setSelectedLayer('layer-1')}
              >
                <div className="flex gap-5">
                  <div className="mt-1 p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-blue-50 group-hover:text-[#2383e2] transition-colors h-fit">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extralight text-slate-900 mb-2">Trabajo sin Fricción</h3>
                    <p className="text-slate-600 text-base leading-relaxed">
                      Es el entorno donde ocurre tu trabajo diario. El objetivo de esta capa es eliminar el ruido administrativo y la microgestión. El sistema se encarga de coordinar los flujos y conectar los datos, permitiéndote concentrarte en crear valor. Además, asegura que tu esfuerzo real sea visible y cuente para adaptar la estrategia de la empresa, evitando que te pidan imposibles.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>
      {/* --- BLOQUE 4: MINDGRATE --- */}
      <section className="sticky top-0 h-screen flex items-center justify-center bg-white overflow-hidden z-0">
        <div className="w-full px-8 md:px-12 lg:px-16 mx-auto flex items-center justify-center">
          <h2 className="text-[13vw] md:text-[18vw] lg:text-[22vw] font-extralight text-slate-900 tracking-tighter leading-none select-none text-center">
            mindgrate
          </h2>
        </div>
      </section>

      {/* --- WAITLIST CTA --- */}
      <section className="relative z-10 py-24 px-4 md:px-8 lg:px-16 bg-black text-white text-center overflow-hidden">
        <KineticMesh color="#ffffff" />
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-extralight leading-tight">
            ¿Te intriga la Inteligencia Sistémica?
          </h2>
          <p className="text-xl text-gray-300">
            Mindgrate propone un cambio fundamental: que la IA deje de acelerar tareas y empiece a sincronizar la coherencia de tu empresa. No buscamos futuros más rápidos, sino futuros que se sostengan en el tiempo.



            Si quieres entender a fondo la tesis detrás de la Systemic Intelligence Architecture y por qué es la infraestructura obligatoria para el siglo XXI, profundiza en nuestros análisis.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-10 py-4 bg-[#2383e2] text-white font-bold rounded-2xl hover:bg-[#1d6ab8] transition-all shadow-lg hover:shadow-blue-900 hover:-translate-y-1 text-lg"
          >
            Explorar la Visión en el Blog
          </button>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 bg-white py-16 px-4 md:px-8 lg:px-16 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

            {/* Columna 1: Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <img
                  src={heroImage2}

                  className="w-8 h-8 object-contain"
                />

              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-8">
                Arquitectura de Inteligencia Sistémica para organizaciones que buscan coherencia, no solo eficiencia.
              </p>
              <div className="flex gap-4">
                <a href="#" className="p-2 bg-slate-50 text-slate-400 hover:text-[#2383e2] hover:bg-blue-50 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a href="#" className="p-2 bg-slate-50 text-slate-400 hover:text-[#2383e2] hover:bg-blue-50 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a href="#" className="p-2 bg-slate-50 text-slate-400 hover:text-[#2383e2] hover:bg-blue-50 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Columna 2: Explorar */}
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Explorar</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a href="#investigacion" className="hover:text-[#2383e2] transition-colors">La Trampa Arquitectónica</a></li>
                <li><a href="#sia" className="hover:text-[#2383e2] transition-colors">Arquitectura SIA</a></li>
                <li><a href="#layers" className="hover:text-[#2383e2] transition-colors">Arquitectura de Materialidad</a></li>
              </ul>
            </div>

            {/* Columna 3: Recursos */}
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Recursos</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a href="#" className="hover:text-[#2383e2] transition-colors">Whitepaper Técnico</a></li>
                <li><a href="#" className="hover:text-[#2383e2] transition-colors">Casos de Estudio</a></li>
                <li><a href="#" className="hover:text-[#2383e2] transition-colors">SIAF Documentation</a></li>
                <li><a href="/login" className="hover:text-[#2383e2] transition-colors">Acceder al MVP</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-slate-400">© 2025 Mindgrate. Todos los derechos reservados.</p>

            <div className="flex gap-8 text-xs text-slate-400">
              <a href="#" className="hover:text-slate-600 transition-colors">Privacidad</a>
              <a href="#" className="hover:text-slate-600 transition-colors">Términos</a>
              <a href="#" className="hover:text-slate-600 transition-colors">Cookies</a>
            </div>

            {/* Icono a la derecha */}
            <div className="hidden md:block">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                <img src={heroImage} alt="Mindgrate Icon" className="w-6 h-6 object-contain" />
              </div>
            </div>
          </div>
        </div>
      </footer>

      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div >
  );
};

export default Home;
