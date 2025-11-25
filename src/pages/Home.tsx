import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, AlertTriangle, Layers, LayoutTemplate, BookOpen, TrendingDown, X, CheckCircle2, BrainCircuit, Network, ShieldCheck } from 'lucide-react';
import KineticMesh from '@/components/landing/KineticMesh';
import supabase from '@/services/supabaseClient';
import { logger } from '@/utils/logger';
import heroImage from '@/images/imageq1_lay.png';

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

  return (
    <div className="bg-white font-sans w-full min-h-screen flex flex-col">

      {/* --- HERO SECTION --- */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden pt-15">
        <KineticMesh />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0 }}
            className="flex flex-col items-center"
          >
            <img
              src={heroImage}
              alt="Mindgrate"
              className="w-20 h-20 md:w-24 md:h-24 object-contain mb-3"
            />
            <h1 className="text-5xl md:text-7xl font-extralight text-gray-900 tracking-tight leading-[1.1] mb-6">
              IA diseñada como un sistema, no como un parche.
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0 }}
            className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Diseñamos la arquitectura que une estrategia, datos y automatización en un solo flujo inteligente.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <a href="/login" className="px-8 py-4 bg-[#2383e2] text-white rounded-2xl font-bold text-lg hover:bg-[#1d6ab8] transition-all shadow-lg hover:shadow-blue-200 hover:-translate-y-1 flex items-center gap-2">
              Prueba el MVP <ArrowRight className="w-5 h-5" />
            </a>
            <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
              Unirse a la lista de espera
            </button>
          </motion.div>
        </div>
      </section >

      {/* --- BLOQUE 2: LA TRAMPA ARQUITECTÓNICA (ACORDEÓN HORIZONTAL) --- */}
      <section id="investigacion" className="relative w-full py-24 px-4 md:px-8 lg:px-16 z-10 overflow-hidden">

        {/* BACKGROUND AMBIENTAL ANIMADO */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-100/30 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-50/40 rounded-full blur-[100px]" style={{ animation: 'pulse 12s ease-in-out infinite' }}></div>
          {/* Grid Pattern Sutil */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(to right, #0f172a 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        {/* Gradient Background Subtle */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/30 to-white pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">

          {/* HEADER */}
          <div className="mb-12 text-center">
            <div className="w-12 h-1 bg-gradient-to-r from-[#2383e2] to-blue-300 mx-auto mb-6 rounded-full"></div>
            <h2 className="text-4xl md:text-6xl font-extralight mb-4 text-slate-900">
              La Trampa <span className="text-[#2383e2]">Arquitectónica</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              El 91% falla en la ejecución. No es un problema de potencia, es un problema de estructura.
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

                {/* Dot pattern - PUNTOS BLANCOS */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

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
                    Mindgrate disuelve los silos permitiendo que la inteligencia fluya transversalmente. Creamos una <strong className="text-white">nueva topología de trabajo</strong>.
                  </p>

                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 relative z-10">
                    <div className="flex items-center gap-3 mb-1">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="font-bold text-sm">Coherencia Sistémica</span>
                    </div>
                    <p className="text-xs text-slate-400 pl-8">
                      Alineación matemática entre estrategia y ejecución.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Hint de interacción */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400 italic">Pasa el cursor sobre cada card para explorar más detalles</p>
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
                <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl">
                  {/* Definiciones de Gradientes */}
                  <defs>
                    <linearGradient id="gradCore" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#2383e2', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#1d4ed8', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>

                  {/* 3. GOVERNANCE LAYER (Anillo Exterior) */}
                  <g className="sia-ring-outer">
                    {/* El anillo fragmentado que representa el filtro ético */}
                    <circle cx="200" cy="200" r="180" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="20 40" opacity="0.3" />
                    <circle cx="200" cy="200" r="170" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="10 10" opacity="0.2" />
                    {/* Icono de escudo orbitando (Simulado con un punto) */}
                    <circle cx="200" cy="20" r="4" fill="#94a3b8" />
                    <circle cx="200" cy="380" r="4" fill="#94a3b8" />
                  </g>

                  {/* 2. MINDOPS LAYER (Red Intermedia) */}
                  <g>
                    {/* Conexiones de datos fluyendo hacia el centro */}
                    <line x1="200" y1="200" x2="100" y2="100" stroke="#2383e2" strokeWidth="2" opacity="0.4" className="sia-connection" />
                    <line x1="200" y1="200" x2="300" y2="100" stroke="#2383e2" strokeWidth="2" opacity="0.4" className="sia-connection" />
                    <line x1="200" y1="200" x2="100" y2="300" stroke="#2383e2" strokeWidth="2" opacity="0.4" className="sia-connection" />
                    <line x1="200" y1="200" x2="300" y2="300" stroke="#2383e2" strokeWidth="2" opacity="0.4" className="sia-connection" />

                    {/* Nodo 1: OPERACIONES */}
                    <g className="group">
                      <circle cx="100" cy="100" r="18" fill="#0f172a" stroke="#2383e2" strokeWidth="2" />
                      <text x="100" y="105" textAnchor="middle" fontSize="9" fill="#2383e2" fontFamily="monospace" fontWeight="bold">OPS</text>
                      {/* Etiqueta Descriptiva */}
                      <text x="100" y="135" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif" className="sia-label">Operaciones</text>
                    </g>

                    {/* Nodo 2: FINANZAS */}
                    <g className="group">
                      <circle cx="300" cy="100" r="18" fill="#0f172a" stroke="#2383e2" strokeWidth="2" />
                      <text x="300" y="105" textAnchor="middle" fontSize="9" fill="#2383e2" fontFamily="monospace" fontWeight="bold">FIN</text>
                      {/* Etiqueta Descriptiva */}
                      <text x="300" y="135" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif" className="sia-label">Finanzas</text>
                    </g>

                    {/* Nodo 3: LEGAL */}
                    <g className="group">
                      <circle cx="100" cy="300" r="18" fill="#0f172a" stroke="#2383e2" strokeWidth="2" />
                      <text x="100" y="305" textAnchor="middle" fontSize="9" fill="#2383e2" fontFamily="monospace" fontWeight="bold">LEG</text>
                      {/* Etiqueta Descriptiva */}
                      <text x="100" y="335" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif" className="sia-label">Legal</text>
                    </g>

                    {/* Nodo 4: TALENTO */}
                    <g className="group">
                      <circle cx="300" cy="300" r="18" fill="#0f172a" stroke="#2383e2" strokeWidth="2" />
                      <text x="300" y="305" textAnchor="middle" fontSize="9" fill="#2383e2" fontFamily="monospace" fontWeight="bold">TAL</text>
                      {/* Etiqueta Descriptiva */}
                      <text x="300" y="335" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif" className="sia-label">Talento</text>
                    </g>
                  </g>

                  {/* 1. DYNAMIC PROJECT CORE (Centro) */}
                  <circle cx="200" cy="200" r="40" fill="url(#gradCore)" className="sia-core" />
                  <text x="200" y="205" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">DPC</text>

                  {/* Anillo interior rotando */}
                  <circle cx="200" cy="200" r="55" fill="none" stroke="#2383e2" strokeWidth="1" strokeDasharray="5 5" opacity="0.5" className="sia-ring-inner" />

                </svg>

                {/* Etiquetas Flotantes */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-300 backdrop-blur-sm">
                  Viabilidad
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: EXPLICACIÓN (Cards Interactivos) */}
            <div className="w-full lg:w-1/2 space-y-6">

              {/* Componente 1: DPC */}
              <div className="group relative bg-slate-50 p-6 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-[#2383e2] transition-all duration-300">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2383e2] rounded-l-xl"></div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-[#2383e2]/10 rounded-lg text-[#2383e2] group-hover:scale-110 transition-transform">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extralight text-gray-900 mb-1">Dynamic Project Core (DPC)</h3>
                    <p className="text-xs font-bold text-[#2383e2] uppercase tracking-widest mb-2">El Núcleo Cognitivo</p>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Traduce la intención estratégica en parámetros operativos en tiempo real. Es la "fuente única de verdad" que simula viabilidad antes de ejecutar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Componente 2: MindOps */}
              <div className="group relative bg-slate-50 p-6 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-[#2383e2] transition-all duration-300">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2383e2] rounded-l-xl"></div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-[#2383e2]/10 rounded-lg text-[#2383e2] group-hover:scale-110 transition-transform">
                    <Network className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extralight text-gray-900 mb-1">MindOps + SIAF</h3>
                    <p className="text-xs font-bold text-[#2383e2] uppercase tracking-widest mb-2">La Red Operativa</p>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Agentes autónomos (Finanzas, Legal, Talento) que ejecutan la táctica. Guiados por el <strong>marco educativo SIAF</strong>, enseñan a la organización a operar en red.
                    </p>
                  </div>
                </div>
              </div>

              {/* Componente 3: Governance (TEXTO ACTUALIZADO AQUÍ) */}
              <div className="group relative bg-slate-50 p-6 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-[#2383e2] transition-all duration-300">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2383e2] rounded-l-xl"></div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-[#2383e2]/10 rounded-lg text-[#2383e2] group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extralight text-gray-900 mb-1">Governance Core</h3>
                    <p className="text-xs font-bold text-[#2383e2] uppercase tracking-widest mb-2">Coste Material & Regeneración</p>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      SIA integra este principio en su núcleo: cada simulación del DPC incluye el <strong>"coste material"</strong> de la estrategia.
                      <br /><br />
                      No permitimos que la eficiencia digital canibalice la viabilidad física de la organización. Es la transición de una <strong>IA extractiva a una IA regenerativa</strong>.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* --- BLOQUE 4: MINDGRATE --- */}
      <section className="relative py-32 md:py-48 px-4 bg-white overflow-hidden">
        <div className="max-w-full mx-auto flex items-center justify-center min-h-[60vh]">
          <h2 className="text-[15vw] md:text-[20vw] lg:text-[25vw] font-extralight text-slate-900 tracking-tighter leading-none select-none">
            mindgrate
          </h2>
        </div>
      </section>

      {/* --- WAITLIST CTA --- */}
      < section className="py-24 px-4 md:px-8 lg:px-16 bg-black text-white text-center" >
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-extralight leading-tight">
            ¿Te interesa la visión?
          </h2>
          <p className="text-xl text-gray-300">
            Si nuestra visión para transformar la gestión de proyectos te inspira, déjanos tu correo. Serás el primero en saber cuándo lancemos nuestra primera versión comercial.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-10 py-4 bg-[#2383e2] text-white font-bold rounded-2xl hover:bg-[#1d6ab8] transition-all shadow-lg hover:shadow-blue-900 hover:-translate-y-1 text-lg"
          >
            Unirse a la Lista de Espera
          </button>
        </div>
      </section >

      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div >
  );
};

export default Home;
