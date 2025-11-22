import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, ArrowRight, Layout } from 'lucide-react';
import KineticMesh from '@/components/landing/KineticMesh';
import supabase from '@/services/supabaseClient';
import { logger } from '@/utils/logger';

import ejmpeloimage from '../images/ejcolab.png';

// --- Componente del Modal para la Lista de Espera ---
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
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center overflow-hidden pt-20">
        <KineticMesh />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6">
              IA diseñada como un sistema, no como un parche.
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
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
      </section>

      {/* --- FEATURES SECTION (BENTO GRID) --- */}
      <section className="py-24 px-4 md:px-8 lg:px-16 bg-white relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              ¿Qué es Mindgrate?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              La arquitectura operativa que vuelve coherente tu inteligencia artificial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-7 h-7 text-[#2383e2]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">El Cerebro (DPC)</h3>
              <h4 className="text-lg font-semibold text-[#2383e2] mb-4">Memoria Viva, no Archivos Muertos</h4>
              <p className="text-gray-600 leading-relaxed text-lg">
                El Dynamic Project Core (DPC) no solo guarda información; la estructura. Convierte documentos dispersos en un grafo de conocimiento activo que conecta el "qué" hacemos con el "por qué" lo hacemos.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Layout className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">El Método (SIAF)</h3>
              <h4 className="text-lg font-semibold text-purple-600 mb-4">Colaboración, no Automatización Ciega</h4>
              <p className="text-gray-600 leading-relaxed text-lg">
                No buscamos reemplazar a los humanos, sino liberarlos. Nuestra arquitectura coordina a los agentes de IA para eliminar la fricción repetitiva, dejando que tu equipo se enfoque en el juicio y la estrategia.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">La Ética (Razón Material)</h3>
              <h4 className="text-lg font-semibold text-green-600 mb-4">Viabilidad, no solo Velocidad</h4>
              <p className="text-gray-600 leading-relaxed text-lg">
                Un sistema que entiende límites. Mindgrate está diseñado para proteger la sostenibilidad de tu organización, asegurando que la eficiencia nunca se logre a costa de quemar a tu equipo.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* --- MVP SECTION --- */}
      < section className="py-24 px-4 md:px-8 lg:px-16 bg-gray-50" >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Valida Nuestra Hipótesis: <span className="text-[#2383e2]">Experimenta el MVP</span>
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Hemos construido este MVP para probar una idea clave: que un agente de IA puede entender tus datos de forma segura y útil.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-[#2383e2] font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Carga tus Datos</h4>
                  <p className="text-gray-600">Sube un archivo CSV, xls o xlsx con información relevante.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-[#2383e2] font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Activa tu Agente</h4>
                  <p className="text-gray-600">Tu agente personal asimilará esta información al instante.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-[#2383e2] font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Ponlo a Prueba</h4>
                  <p className="text-gray-600">Realiza consultas y observa cómo interactúa.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-transparent rounded-3xl transform rotate-3"></div>
            <img
              src={ejmpeloimage}
              alt="MVP Demo"
              className="relative rounded-3xl shadow-2xl border border-gray-200 w-full"
            />
          </div>
        </div>
      </section >

      {/* --- ROADMAP SECTION --- */}
      < section className="py-24 px-4 md:px-8 lg:px-16 bg-white" >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">Nuestra Hoja de Ruta</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hacia la Transformación Operativa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Optimización Estratégica</h3>
              <p className="text-gray-600">Alinea recursos, presupuesto y tiempo de forma inteligente. Analiza la viabilidad de nuevos proyectos automáticamente.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Detección de Riesgos</h3>
              <p className="text-gray-600">Anticípate a los problemas antes de que se conviertan en crisis, notificando a los agentes y personas clave.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Capitalización del Conocimiento</h3>
              <p className="text-gray-600">Convierte la experiencia de tu equipo en un activo reutilizable. Captura aprendizajes al instante.</p>
            </div>
          </div>
        </div>
      </section >

      {/* --- WAITLIST CTA --- */}
      < section className="py-24 px-4 md:px-8 lg:px-16 bg-black text-white text-center" >
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
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
