import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KineticMesh from '@/components/landing/KineticMesh';
import supabase from '@/services/supabaseClient';
import { logger } from '@/utils/logger';

const BetaApplication: React.FC = () => {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Estado del formulario
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        organization: '',
        role: '',
        mainChallenge: '',
        priority: '',
        teamSize: '',
        tools: [] as string[],
        commitment: '',
    });

    // Efecto de opacidad del mesh basado en scroll
    const meshOpacity = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], [0.3, 0.1, 0.4, 0.15, 0.35, 0.2]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = (tool: string) => {
        setFormData({
            ...formData,
            tools: formData.tools.includes(tool)
                ? formData.tools.filter(t => t !== tool)
                : [...formData.tools, tool],
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { data, error: supabaseError } = await supabase
                .from('beta_applications')
                .insert([
                    {
                        full_name: formData.fullName,
                        work_email: formData.email,
                        organization_name: formData.organization,
                        role: formData.role,
                        primary_challenge: formData.mainChallenge,
                        primary_goal: formData.priority,
                        team_size: formData.teamSize,
                        current_tools: formData.tools,
                        siaf_adoption_willingness: formData.commitment,
                    },
                ])
                .select();

            if (supabaseError) {
                logger.error('Error de Supabase:', supabaseError);
                throw new Error(supabaseError.message || 'Error al enviar la solicitud');
            }

            logger.log('Solicitud enviada exitosamente:', data);
            setIsSubmitted(true);
        } catch (err) {
            logger.error('Error al enviar solicitud:', err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Hubo un problema al enviar tu solicitud. Inténtalo de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0">
                    <KineticMesh color="#ffffff" />
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 max-w-2xl mx-auto px-6 text-center"
                >
                    <div className="mb-8">
                        <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-12 h-12 text-green-400" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extralight mb-4">
                            Tu solicitud ha entrado en el sistema.
                        </h1>
                    </div>
                    <p className="text-xl text-gray-300 leading-relaxed mb-8">
                        Hemos recibido los parámetros de tu organización. Nuestro equipo de Arquitectura de Soluciones analizará la topología de tu equipo para determinar la configuración ideal del Dynamic Project Core (DPC).
                    </p>
                    <p className="text-lg text-gray-400 mb-8">
                        En breve recibirás un contacto para agendar tu sesión de <strong className="text-white">Onboarding Sistémico</strong>.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-8 py-4 bg-[#2383e2] text-white rounded-2xl font-bold text-lg hover:bg-[#1d6ab8] transition-all shadow-lg hover:-translate-y-1"
                    >
                        Volver al Inicio
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white relative">
            {/* KineticMesh con opacidad dinámica */}
            <motion.div className="fixed inset-0 pointer-events-none" style={{ opacity: meshOpacity }}>
                <KineticMesh color="#ffffff" />
            </motion.div>

            {/* Contenido */}
            <div className="relative z-10 max-w-4xl mx-auto px-6 pt-40 pb-20">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-6xl font-extralight mb-6 leading-tight">
                        Postulación al Programa Beta:<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2383e2] to-blue-400">
                            Arquitectura de Inteligencia Sistémica
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        Mindgrate no es una herramienta de gestión de tareas; es una infraestructura de gobernanza. Para garantizar que el sistema genere coherencia real desde el primer día, nuestras implementaciones Beta son asistidas y configuradas a medida de tu ecosistema.
                    </p>
                </motion.div>

                {/* Formulario */}
                <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    onSubmit={handleSubmit}
                    className="space-y-12"
                >
                    {/* Sección 1: Identidad del Nodo */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                        <h2 className="text-2xl font-extralight mb-2">Sección 1: Identidad del Nodo</h2>
                        <p className="text-sm text-gray-400 mb-8">El punto de partida para configurar tu perfil de liderazgo.</p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Nombre Completo *</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#2383e2] focus:border-transparent transition-all"
                                    placeholder="Tu nombre completo"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Correo Corporativo *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#2383e2] focus:border-transparent transition-all"
                                    placeholder="tu@empresa.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Organización / Empresa *</label>
                                <input
                                    type="text"
                                    name="organization"
                                    value={formData.organization}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#2383e2] focus:border-transparent transition-all"
                                    placeholder="Nombre de tu organización"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-4">Rol Principal *</label>
                                <div className="space-y-3">
                                    {[
                                        { value: 'ceo', label: 'CEO / Fundador (Arquitecto de Viabilidad)' },
                                        { value: 'coo', label: 'Operaciones / COO (Orquestador)' },
                                        { value: 'product', label: 'Líder de Producto / Tecnología' },
                                        { value: 'talent', label: 'Líder de Talento / Personas' },
                                        { value: 'other', label: 'Otro' },
                                    ].map((option) => (
                                        <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="role"
                                                value={option.value}
                                                checked={formData.role === option.value}
                                                onChange={handleInputChange}
                                                required
                                                className="w-5 h-5 text-[#2383e2] bg-white/10 border-white/20 focus:ring-[#2383e2]"
                                            />
                                            <span className="text-gray-300 group-hover:text-white transition-colors">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección 2: Diagnóstico de Fricción Sistémica */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                        <h2 className="text-2xl font-extralight mb-2">Sección 2: Diagnóstico de Fricción Sistémica</h2>
                        <p className="text-sm text-gray-400 mb-8">Ayúdanos a entender dónde pierde energía tu organización actualmente.</p>

                        <div className="space-y-8">
                            <div>
                                <label className="block text-sm font-medium mb-4">1. ¿Cuál es el principal desafío operativo que enfrentan hoy? *</label>
                                <div className="space-y-3">
                                    {[
                                        { value: 'silos', label: 'Silos Desconectados', desc: 'Los departamentos (Ventas, Tech, Marketing) no hablan el mismo idioma.' },
                                        { value: 'disociacion', label: 'Disociación Estratégica', desc: 'La estrategia dice "X", pero la operación diaria hace "Y".' },
                                        { value: 'entropia', label: 'Entropía de Información', desc: 'Demasiadas herramientas, datos dispersos y falta de una fuente única de verdad.' },
                                        { value: 'fatiga', label: 'Fatiga Humana', desc: 'Alta velocidad de ejecución, pero con alto costo de burnout y confusión.' },
                                    ].map((option) => (
                                        <label key={option.value} className="flex items-start gap-3 cursor-pointer group p-4 rounded-xl hover:bg-white/5 transition-all">
                                            <input
                                                type="radio"
                                                name="mainChallenge"
                                                value={option.value}
                                                checked={formData.mainChallenge === option.value}
                                                onChange={handleInputChange}
                                                required
                                                className="w-5 h-5 mt-0.5 text-[#2383e2] bg-white/10 border-white/20 focus:ring-[#2383e2]"
                                            />
                                            <div>
                                                <span className="text-white font-medium block mb-1">{option.label}</span>
                                                <span className="text-sm text-gray-400">{option.desc}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-4">2. ¿Qué buscas resolver prioritariamente con Mindgrate? *</label>
                                <div className="space-y-3">
                                    {[
                                        { value: 'eficiencia', label: 'Eficiencia Táctica', desc: 'Automatizar flujos y reducir trabajo manual (Fase 1).' },
                                        { value: 'claridad', label: 'Claridad Operativa', desc: 'Tener visibilidad real de qué está pasando y por qué (DPC).' },
                                        { value: 'viabilidad', label: 'Viabilidad Futura', desc: 'Simular escenarios para asegurar la sostenibilidad del negocio.' },
                                    ].map((option) => (
                                        <label key={option.value} className="flex items-start gap-3 cursor-pointer group p-4 rounded-xl hover:bg-white/5 transition-all">
                                            <input
                                                type="radio"
                                                name="priority"
                                                value={option.value}
                                                checked={formData.priority === option.value}
                                                onChange={handleInputChange}
                                                required
                                                className="w-5 h-5 mt-0.5 text-[#2383e2] bg-white/10 border-white/20 focus:ring-[#2383e2]"
                                            />
                                            <div>
                                                <span className="text-white font-medium block mb-1">{option.label}</span>
                                                <span className="text-sm text-gray-400">{option.desc}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección 3: Topología del Sistema */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                        <h2 className="text-2xl font-extralight mb-2">Sección 3: Topología del Sistema (Escala)</h2>
                        <p className="text-sm text-gray-400 mb-8">Para dimensionar los MindOps (Agentes) y el DPC necesarios.</p>

                        <div className="space-y-8">
                            <div>
                                <label className="block text-sm font-medium mb-4">3. Tamaño del equipo a coordinar: *</label>
                                <div className="space-y-3">
                                    {[
                                        { value: 'small', label: 'Célula (< 10 personas)' },
                                        { value: 'medium', label: 'Organización en crecimiento (10 - 50 personas)' },
                                        { value: 'large', label: 'Ecosistema complejo (+ 50 personas)' },
                                    ].map((option) => (
                                        <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="teamSize"
                                                value={option.value}
                                                checked={formData.teamSize === option.value}
                                                onChange={handleInputChange}
                                                required
                                                className="w-5 h-5 text-[#2383e2] bg-white/10 border-white/20 focus:ring-[#2383e2]"
                                            />
                                            <span className="text-gray-300 group-hover:text-white transition-colors">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-4">4. ¿Qué herramientas utilizan actualmente para "intentar" conectarse? (Selección múltiple)</label>
                                <div className="space-y-3">
                                    {[
                                        { value: 'project_mgmt', label: 'Notion / Asana / Monday (Gestión de Proyectos)' },
                                        { value: 'communication', label: 'Slack / Teams (Comunicación)' },
                                        { value: 'spreadsheets', label: 'Excel / Sheets (La verdad oculta)' },
                                        { value: 'erp_crm', label: 'ERP / CRM tradicionales' },
                                    ].map((option) => (
                                        <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.tools.includes(option.value)}
                                                onChange={() => handleCheckboxChange(option.value)}
                                                className="w-5 h-5 text-[#2383e2] bg-white/10 border-white/20 rounded focus:ring-[#2383e2]"
                                            />
                                            <span className="text-gray-300 group-hover:text-white transition-colors">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección 4: Compromiso de Implementación */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                        <h2 className="text-2xl font-extralight mb-2">Sección 4: Compromiso de Implementación (SIAF)</h2>
                        <p className="text-sm text-gray-400 mb-8">Mindgrate requiere un cambio de mentalidad, no solo de software.</p>

                        <div>
                            <label className="block text-sm font-medium mb-4">
                                5. Mindgrate opera bajo el principio de "Razón Material" (sostenibilidad real). ¿Está tu organización dispuesta a adoptar un nuevo marco de aprendizaje (SIAF) para mejorar su toma de decisiones? *
                            </label>
                            <div className="space-y-3">
                                {[
                                    { value: 'yes', label: 'Sí, buscamos transformar nuestra cultura operativa.' },
                                    { value: 'software_only', label: 'Solo buscamos una herramienta de software, no un cambio metodológico.' },
                                    { value: 'unsure', label: 'No estoy seguro, necesito ver la demostración.' },
                                ].map((option) => (
                                    <label key={option.value} className="flex items-start gap-3 cursor-pointer group p-4 rounded-xl hover:bg-white/5 transition-all">
                                        <input
                                            type="radio"
                                            name="commitment"
                                            value={option.value}
                                            checked={formData.commitment === option.value}
                                            onChange={handleInputChange}
                                            required
                                            className="w-5 h-5 mt-0.5 text-[#2383e2] bg-white/10 border-white/20 focus:ring-[#2383e2]"
                                        />
                                        <span className="text-gray-300 group-hover:text-white transition-colors">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-200">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-center pt-8">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`px-10 py-5 bg-[#2383e2] text-white rounded-2xl font-bold text-lg transition-all shadow-2xl flex items-center gap-3 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#1d6ab8] hover:-translate-y-1 hover:shadow-blue-500/50'
                                }`}
                        >
                            {isLoading ? 'Enviando...' : 'Solicitar Evaluación de Viabilidad'}
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>
                </motion.form>
            </div>
        </div>
    );
};

export default BetaApplication;
