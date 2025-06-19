import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/LoginForm';
import SignupForm from '@/components/SignupForm';
import logoImage from '@/images/imageq1_lay.png';

type AuthMode = 'login' | 'signup';

interface AuthPageProps {
  defaultMode?: AuthMode;
}

const AuthPage: React.FC<AuthPageProps> = ({ defaultMode = 'login' }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  // Redirect if user is already authenticated
  if (!loading && user) {
    return <Navigate to="/chat" replace />;
  }

  const handleToggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
  };

  const handleAuthSuccess = () => {
    // Small delay to allow auth state to update
    setTimeout(() => {
      navigate('/chat');
    }, 500);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">        {/* Logo and Brand */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-3">
            <img 
              src={logoImage}  
              alt="Mindgrate" 
              className="h-12 w-auto"
            />
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-100 sm:rounded-2xl sm:px-10">
          {/* Tab Navigation */}
          <div className="flex mb-8 bg-gray-50 rounded-xl p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'signup'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Forms */}
          <div className="transition-all duration-300 ease-in-out">
            {mode === 'login' ? (
              <LoginForm 
                onToggleMode={handleToggleMode}
                onSuccess={handleAuthSuccess}
              />
            ) : (
              <SignupForm 
                onToggleMode={handleToggleMode}
                onSuccess={handleAuthSuccess}
              />
            )}
          </div>
        </div>        {/* Additional Links */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">¿Necesitas ayuda?</span>
            </div>
          </div>          <div className="mt-6 text-center space-y-2">
            <a
              href="mailto:support@mindgrate.com"
              className="block text-sm text-gray-600 hover:text-black transition-colors"
            >
              Contactar soporte
            </a>            <button
              onClick={() => setShowTermsModal(true)}
              className="block text-sm text-gray-600 hover:text-black transition-colors w-full"
            >
              Términos y Condiciones
            </button>
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="block text-sm text-gray-600 hover:text-black transition-colors w-full"
            >
              Política de Privacidad
            </button>          </div></div>
      </div>
      
      {/* Modal de Términos y Condiciones */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Términos y Condiciones de Uso</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="prose prose-sm max-w-none text-gray-700">
                <p className="text-sm text-gray-500 mb-4">Última actualización: 19 de junio de 2025</p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm">
                    <strong>Nota sobre el estado legal:</strong> Mindgrate se encuentra actualmente en proceso de constitución como sociedad mercantil. Esta Política de Privacidad es provisional y podrá ser ajustada tras la formalización de la entidad jurídica.
                  </p>
                </div>

                <p className="mb-4">
                  Mindgrate (empresa en proceso de constitución) (en adelante, "Mindgrate", "nosotros" o "nuestro") pone a disposición de los usuarios ("Usuario" o "usted") los presentes Términos y Condiciones de Uso ("T&C"), que regulan el acceso y utilización de la plataforma MindOps (la "Plataforma"). Al crear una cuenta o utilizar la Plataforma, usted acepta íntegra y expresamente estos T&C.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm">
                    <strong>Nota sobre el estado legal:</strong> Mindgrate se encuentra actualmente en proceso de constitución como sociedad mercantil. Estos T&C se emiten con carácter provisional y podrán actualizarse una vez formalizada la constitución.
                  </p>
                </div>

                <h3 className="text-lg font-semibold mt-6 mb-3">1. Aceptación de los Términos</h3>
                <p className="mb-4">
                  Al registrarse, acceder o utilizar la Plataforma, el Usuario reconoce haber leído, entendido y aceptado estos T&C y nuestra Política de Privacidad. Si el Usuario no está de acuerdo, debe abstenerse de utilizar la Plataforma.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-3">2. Descripción del Servicio</h3>
                <p className="mb-4">
                  MindOps es un Producto Mínimo Viable (MVP) de plataforma de inteligencia artificial que permite a los Usuarios crear y gestionar agentes de IA ("MindOps"), cargar datos estructurados y facilitar la colaboración entre dichos agentes. Al encontrarse en fase MVP, algunas funcionalidades pueden cambiar, limitarse o interrumpirse sin previo aviso. El servicio incluye almacenamiento, procesamiento, vectorización y visualización de datos, así como la integración con servicios de IA de terceros.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-3">3. Cuentas de Usuario</h3>
                <p className="mb-2"><strong>Responsabilidad del Usuario.</strong> El Usuario es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades que ocurran en su cuenta.</p>
                <p className="mb-2"><strong>Elegibilidad.</strong> El servicio está dirigido a personas mayores de 18 años. Al registrarse, el Usuario declara que cumple este requisito.</p>
                <p className="mb-4"><strong>Suspensión o Terminación.</strong> Mindgrate se reserva el derecho de suspender o cancelar cuentas, con o sin previo aviso, cuando considere que se han violado estos T&C.</p>

                <h3 className="text-lg font-semibold mt-6 mb-3">4. Contenido del Usuario</h3>
                <p className="mb-2"><strong>Propiedad.</strong> El Usuario conserva la propiedad íntegra de los archivos (.xls, .xlsx) y de los datos que cargue en la Plataforma.</p>
                <p className="mb-2"><strong>Licencia Limitada.</strong> El Usuario otorga a Mindgrate una licencia mundial, no exclusiva, revocable y libre de regalías para: (i) almacenar, procesar y vectorizar el Contenido; (ii) transmitir fragmentos a servicios de IA de terceros (p. ej., OpenAI para embeddings, Google Gemini) con el único fin de generar respuestas; (iii) mostrar los datos al propio Usuario y a los colaboradores autorizados.</p>
                <p className="mb-4"><strong>Responsabilidad sobre el Contenido.</strong> El Usuario garantiza que posee todos los derechos necesarios y que el Contenido no infringe derechos de terceros ni viola la ley aplicable. Mindgrate no se hace responsable del Contenido del Usuario.</p>

                <h3 className="text-lg font-semibold mt-6 mb-3">5. Contenido Generado por IA</h3>
                <p className="mb-2"><strong>Descargo de Responsabilidad.</strong> Las respuestas generadas por los agentes de IA pueden contener errores o imprecisiones y no sustituyen el juicio humano profesional.</p>
                <p className="mb-2"><strong>No Asesoramiento Profesional.</strong> El Contenido generado no constituye asesoramiento legal, financiero, médico ni de otra naturaleza profesional.</p>
                <p className="mb-4"><strong>Propiedad de la Salida.</strong> Salvo que la ley disponga otra cosa, la propiedad intelectual de la salida generada pertenece al Usuario, quien reconoce que tal salida puede estar basada en información pública o en datos provistos por el propio Usuario.</p>

                <h3 className="text-lg font-semibold mt-6 mb-3">6. Política de Uso Aceptable</h3>
                <p className="mb-4">
                  Queda prohibido: (i) subir o compartir contenido ilegal, difamatorio o que viole derechos de autor; (ii) interferir con la seguridad o integridad de la Plataforma; (iii) acosar, amenazar o enviar solicitudes maliciosas a otros Usuarios; (iv) realizar ingeniería inversa, descompilar o intentar extraer el código fuente de la Plataforma.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-3">7. Servicios de Terceros y Disponibilidad</h3>
                <p className="mb-4">
                  MindOps utiliza proveedores de infraestructura como Supabase para bases de datos, autenticación y funciones backend. La disponibilidad del servicio puede depender de estos terceros. Consulte los Términos de Servicio de Supabase para más información.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-3">8. Suscripciones y Pagos</h3>
                <p className="mb-2">La versión actual (MVP) de MindOps se ofrece sin costo para todos los Usuarios. Durante esta fase de prueba pública:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>No existen cargos, planes de pago ni ciclos de facturación.</li>
                  <li>Mindgrate se reserva el derecho de introducir planes de suscripción o tarifas en versiones futuras, lo cual se comunicará al menos con 30 días de antelación y requerirá la aceptación expresa de los nuevos términos por parte del Usuario.</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6 mb-3">9. Limitación de Responsabilidad y Garantías</h3>
                <p className="mb-4">
                  La Plataforma, actualmente en fase MVP, se ofrece "tal cual" y "según disponibilidad", sin garantías de ningún tipo. Mindgrate no será responsable por daños indirectos, pérdida de datos, lucro cesante o cualquier otro perjuicio derivado del uso o imposibilidad de uso de la Plataforma.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-3">10. Ley Aplicable y Jurisdicción</h3>
                <p className="mb-4">
                  Estos T&C se rigen por las leyes de México. Toda controversia se someterá a los tribunales competentes de [Ciudad], [Estado], renunciando las partes a cualquier otro fuero que pudiera corresponderles.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-3">11. Modificaciones a los Términos</h3>
                <p className="mb-4">
                  Mindgrate podrá actualizar estos T&C. Los cambios se publicarán en la Plataforma y entrarán en vigor a los 30 días. El uso continuado después de dicha fecha constituirá aceptación de las modificaciones.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-3">12. Contacto</h3>
                <p className="mb-4">
                  Para dudas sobre estos T&C, contacte a: <a href="mailto:admin@mindgrate.net" className="text-blue-600 hover:text-blue-800">admin@mindgrate.net</a>
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>      )}
      
      {/* Modal de Política de Privacidad */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Política de Privacidad</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="prose prose-sm max-w-none text-gray-700">
                <p className="text-sm text-gray-500 mb-4">Última actualización: 19 de junio de 2025</p>
                
                <p className="mb-6">
                  La presente Política de Privacidad describe cómo Mindgrate (empresa en proceso de constitución) ("Mindgrate") recopila, utiliza, comparte y protege los datos personales de los Usuarios de la Plataforma MindOps.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-3">1. Información que Recopilamos</h3>
                
                <h4 className="font-semibold mb-2">1.1 Proporcionada por el Usuario</h4>
                <ul className="list-disc pl-6 mb-4">
                  <li><strong>Datos de cuenta:</strong> nombre, correo electrónico.</li>
                  <li><strong>Contenido del Usuario:</strong> archivos .xls/.xlsx y su información incorporada.</li>
                  <li><strong>Historial de conversación</strong> entre el Usuario y los agentes de IA.</li>
                </ul>

                <h4 className="font-semibold mb-2">1.2 Recopilada Automáticamente</h4>
                <ul className="list-disc pl-6 mb-4">
                  <li><strong>Datos de uso:</strong> interacciones con la Plataforma.</li>
                  <li><strong>Datos de dispositivo/conexión:</strong> dirección IP, tipo de navegador, sistema operativo, identificadores de dispositivo.</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6 mb-3">2. Cómo Utilizamos la Información</h3>
                <ul className="list-disc pl-6 mb-4">
                  <li>Proveer, operar y mantener la Plataforma.</li>
                  <li>Evaluar el desempeño del MVP y desarrollar nuevas funcionalidades.</li>
                  <li>Comunicarnos con el Usuario respecto a su cuenta, actualizaciones o soporte.</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6 mb-3">3. Con Quién Compartimos la Información</h3>
                <p className="mb-2"><strong>Proveedores de IA de Terceros:</strong> fragmentos de datos (chunks y consultas) se envían a OpenAI y Google para procesar embeddings y generar respuestas. Consulte sus políticas de privacidad respectivas.</p>
                <p className="mb-2"><strong>Otros Usuarios:</strong> el perfil público de un MindOp (mindop_name, mindop_description) es visible para otros. Durante una colaboración, la consulta del Usuario se comparte con el MindOp objetivo.</p>
                <p className="mb-2"><strong>Proveedores de Infraestructura:</strong> utilizamos Supabase para bases de datos y backend. Los datos del Usuario residen en sus servidores. Revise la Política de Privacidad de Supabase para mayor transparencia.</p>
                <p className="mb-4"><strong>Requerimientos Legales:</strong> podemos divulgar datos cuando la ley lo exija o para proteger derechos, propiedad o seguridad de Mindgrate y sus Usuarios.</p>

                <h3 className="text-lg font-semibold mt-6 mb-3">4. Seguridad de los Datos</h3>
                <p className="mb-4">
                  Empleamos cifrado TLS/HTTPS, políticas RLS y controles de acceso basados en roles para proteger los datos. Sin embargo, ningún sistema es completamente seguro y no podemos garantizar seguridad absoluta.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-3">5. Derechos ARCO</h3>
                <p className="mb-4">
                  El Usuario puede ejercer sus derechos de Acceso, Rectificación, Cancelación u Oposición enviando una solicitud a <a href="mailto:privacy@mindgrate.ai" className="text-blue-600 hover:text-blue-800">admin@mindgrate.net</a>. Responderemos conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-3">6. Retención de Datos</h3>
                <p className="mb-4">
                  Conservamos la información mientras la cuenta esté activa o sea necesario para cumplir con obligaciones legales y contractuales.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-3">7. Menores de Edad</h3>
                <p className="mb-4">
                  La Plataforma no está dirigida a menores de 18 años. No recopilamos deliberadamente datos de menores. Si usted es padre, madre o tutor y cree que su hijo nos ha proporcionado datos personales, contáctenos.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-3">8. Cambios a esta Política</h3>
                <p className="mb-4">
                  Podemos actualizar esta Política. Publicaremos la versión actualizada en la Plataforma e indicaremos la fecha de vigencia. El uso continuado se considerará aceptación de los cambios.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-3">9. Contacto</h3>
                <p className="mb-4">
                  Para preguntas sobre privacidad, escríbanos a <a href="mailto:admin@mindgrate.net" className="text-blue-600 hover:text-blue-800">admin@mindgrate.net</a>
                </p>

                <p className="mt-6 text-sm text-gray-500 border-t pt-4">
                  Mindgrate (empresa en proceso de constitución) – Todos los derechos reservados.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
