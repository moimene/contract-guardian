Playbook de revisión de PSA/DSA para Amazon: matriz de cláusulas y ejemplos para sistemas RAG
Este playbook entrega una matriz de revisión contractual específica para acuerdos de Servicios de Programa/Desarrollo (PSA/DSA) de Amazon con casas productoras, construida a partir de los documentos adjuntos. [1] La respuesta directa es que incluimos una tabla de dataset con tipologías de cláusulas y, para cada nivel de aceptación de Amazon, 20 ejemplos concretos por celda que pueden nutrir un sistema RAG de análisis. [1] El alcance se centra en los términos principales de derechos, créditos, representaciones y garantías, indemnidades, y defensa/settlement tal como se recogen en los playbooks y guías de fallback adjuntos, con fecha de referencia 13 de enero de 2026. [1] Cuando procede, indicamos el criterio Amazon de “aceptable”, “pasable” y “no aceptable” conforme a la política reflejada en los materiales; donde existan matices sujetos a aprobación legal, se identifica su carácter condicional.
Alcance, supuestos y metodología
Este playbook se basa en los documentos subidos por el usuario que contienen el Playbook DSA de Amazon y la guía de “Principal Terms Fallbacks” del PSA. [1] Los materiales describen posiciones estándar, desvíos aceptables, desvíos no aceptables y notas de negociación de Amazon relacionadas con derechos y titularidad del programa y materiales, honorarios, créditos y obligaciones frente a terceros, representaciones y garantías, indemnidades y defensa, confidencialidad, protección de datos, impuestos y ley aplicable. [1] La matriz de ejemplos se ha construido tomando los enunciados de política y los fallbacks textuales como base estilística y sustantiva, evitando introducir supuestos no contemplados, salvo ajustes de redacción neutros en español que no alteran el sentido de las cláusulas. [1]
El término “Aceptables” describe formulaciones alineadas con la posición estándar o con desvíos expresamente permitidos sin necesidad de escalamiento legal. [1] “Pasables” recoge formulaciones que Amazon ha aceptado en escenarios de negociación condicionados o con aprobación de Legal indicada en los documentos. [2] “No aceptables” identifica propuestas contrarias a política o que desplazan riesgos de modo inasumible para Amazon. El objetivo es que el sistema RAG reconozca patrones lingüísticos y semánticos para clasificar y puntuar riesgos en revisiones futuras. [1]
Para esta primera entrega se priorizan seis tipologías nucleares en las que se observa mayor fricción negociadora y que concentran la sustancia del riesgo: Honorarios (Fees), Créditos y obligaciones frente a terceros, Representaciones y garantías de ProdCo, Representaciones y garantías de Amazon, Indemnidad de ProdCo, Indemnidad de Amazon, y Defensa y resolución de reclamaciones. [1] Cada celda de la matriz contiene 20 ejemplos concisos y normalizados que reflejan variantes reales o verosímiles derivadas de los materiales adjuntos. [1]
Criterios de aceptación por categoría y política de Amazon
La tipología de Honorarios gira en torno a la condición de pago vinculada a la ausencia de incumplimiento por parte de ProdCo y a la sujeción a otros términos aplicables. Los materiales permiten, como desviación aceptable, acotar el “incumplimiento” a “incumplimiento material no subsanado” en esta sección, preservando referencias a condiciones y Exhibit A. [3] No se admiten otros calificadores como “persistente” o “confirmado por laudo”.
En Créditos y obligaciones frente a terceros, la norma es que Amazon controla créditos y emplea esfuerzos razonables para informar a terceros con los que tiene privity, sin responsabilidad por el incumplimiento de esos terceros. [4] Con aprobación legal, puede obligarse contractualmente a tales terceros sin deber de policía. [5] Es inaceptable imponer responsabilidad a Amazon por conducta de terceros o extender obligaciones más allá de su privity.
Las Representaciones y garantías de ProdCo incluyen originalidad y no infracción sin calificadores de conocimiento, cumplimiento de leyes relevantes (sanciones, anti-boicot, exportación/reexportación, reimportación cuando aplique) y cumplimiento de políticas de Amazon notificadas previamente, pudiendo citar el Development Kickoff Packet. [6] Cabe, con aprobación legal, suprimir referencias a leyes específicas no aplicables. [7] No se admiten calificadores como “a su leal saber y entender”.
En las Representaciones y garantías de Amazon, la política permite únicamente una garantía limitada de capacidad y poder para celebrar y ejecutar el acuerdo. [8] Alternativamente, y con aprobación, puede insertarse un compromiso mutuo de contar con medidas para asegurar el cumplimiento o de cumplimiento material de leyes. [9] No se agregan otras R&Ws a cargo de Amazon.
En Indemnidad de ProdCo, Amazon exige obligación de indemnizar, defender a opción de Amazon, y mantener indemne por reclamaciones de terceros vinculadas al desarrollo y producción, incumplimientos de ProdCo (idealmente incluyendo “supuesto incumplimiento”) y negligencia o dolo de ProdCo. La supresión de “supuesto” no es preferible pero puede no ser deal-breaker. [10] No se acepta eliminar la obligación de defensa ni limitar la indemnidad a dolo.
En Indemnidad de Amazon, el alcance aceptable cubre reclamaciones de terceros derivadas de la distribución, marketing, publicidad y explotación del Programa, pudiendo incluir “derechos accesorios”, e incorporar a las afiliadas de ProdCo como indemniados. [11] No se incluyen “cesionarios” o “sucesores” de ProdCo. La inclusión de un gatillo por incumplimiento de Amazon requiere aprobación.
En Defensa y resolución de reclamaciones, Amazon controla la defensa y el settlement, el retraso en la notificación no libera salvo perjuicio material, y ProdCo puede participar a su costo. [12] Es aceptable exigir consentimiento de ProdCo para acuerdos que le impongan obligaciones o admisiones, siempre que sea razonablemente no denegado. [13] No se admiten restricciones que mermen el control de Amazon sobre su propia defensa fuera de ese marco.
Matriz de dataset RAG — Parte 1
Tabla 1: Tipologías y ejemplos de aceptación para PSA/DSA Amazon (20 ejemplos por celda)
Tipología de cláusula	Aceptables	Pasables	No aceptables
Honorarios (Fees)	1) “Si ProdCo no se encuentra en incumplimiento material no subsanado de este Acuerdo, recibirá los honorarios de Exhibit A, sujeto a los demás términos aplicables.” 
 2) “El pago procede siempre que no exista incumplimiento material no curado y conforme a condiciones de este Acuerdo.” 
 3) “Honorarios pagaderos si ProdCo no está en incumplimiento material no subsanado y según Exhibit A.” 
 4) “Compensación sujeta a ausencia de incumplimiento material no subsanado y a otros términos y condiciones.” 
 5) “Si no hay incumplimiento material no subsanado, Amazon abonará los importes de Exhibit A.” 
 6) “Pagos condicionados a no existir incumplimiento material no curado por ProdCo.” 
 7) “Honorarios debidos si ProdCo cumple y no incurre en incumplimiento material no subsanado.” 
 8) “La obligación de pago rige salvo incumplimiento material no curado por ProdCo.” 
 9) “Los honorarios se devengan conforme a Exhibit A si ProdCo no está en incumplimiento material no subsanado.” 
 10) “Pagos sujetos a demás términos del Acuerdo y a la inexistencia de incumplimiento material no subsanado.” 
 11) “Si ProdCo no está en incumplimiento material no subsanado, Amazon pagará los honorarios acordados.” 
 12) “Honorarios condicionados a no haber incumplimiento material no curado, sin perjuicio de otros términos.” 
 13) “Devengo de honorarios si no concurren incumplimientos materiales no subsanados por ProdCo.” 
 14) “Pagos conforme Exhibit A y ausencia de incumplimiento material no subsanado.” 
 15) “Obligación de pago vigente siempre que ProdCo no esté en incumplimiento material no curado.” 
 16) “Compensación exigible si no hay incumplimiento material no subsanado, sujeta al resto de condiciones.” 
 17) “Amazon pagará según Exhibit A cuando no exista incumplimiento material no subsanado.” 
 18) “Devengos sujetos a no existir incumplimiento material no curado y a los términos aplicables.” 
 19) “Honorarios debidos con ausencia de incumplimiento material no subsanado por ProdCo.” 
 20) “Pagos condicionados a cumplimiento y no existencia de incumplimiento material no curado, conforme a Exhibit A.”	1) “Si ProdCo no está en incumplimiento material y/o no subsanado…”, manteniendo “sujeto a otros términos”. 
 2) “Pagos referidos a Exhibit A; la referencia a ‘sujeto a cualesquiera otros términos’ se mantiene.” 
 3) “Reconocimiento de mecanismo pay-or-play solo si ya figura en Exhibit A.” 
 4) “Aclaración de que las fechas de pago pueden ajustarse por suspensión/Extensión según cláusulas estándar.” 
 5) “Añadir que los pagos se harán tras recepción de factura válida, sin alterar condicionantes de incumplimiento.” 
 6) “Permitir prorrateo en caso de hitos parciales definido en Exhibit A.” [14] 
 7) “Prever pagos en moneda pactada con tasas/impuestos según sección fiscal, sin rebajar condicionantes.” [15] 
 8) “Prever deducción de retenciones legalmente exigibles, preservando triggers de pago.” [16] 
 9) “Aclarar que los pagos están sujetos a condiciones precedentes del Exhibit A.” [14] 
 10) “Incluir un breve período administrativo de procesamiento sin constituir renuncia a condiciones.” [17] 
 11) “Habilitar ajustes por force majeure conforme cláusula de suspensión.” [18] 
 12) “Admitir cronograma de pagos alterno si respeta condicionantes por incumplimiento.” 
 13) “Incorporar dirección de pagos a cuenta designada, sin impacto en condiciones.” [19] 
 14) “Permitir factura electrónica como requisito de proceso, manteniendo triggers de pago.” [20] 
 15) “Prever auditoría de facturas por cumplimiento de hitos, sin eliminar condicionantes.” [4] 
 16) “Confirmar que pagos no constituyen aceptación de prestaciones en caso de incumplimiento posterior.” 
 17) “Incluir mecanismo de subsanación de errores de facturación sin alterar condicionantes.” 
 18) “Clarificar que penalidades por retraso no aplican si hay suspensión válida.” 
 19) “Incluir contacto operativo para pagos sin cambiar contenido obligacional.” 
 20) “Redacción que evita duplicidad con Exhibit A manteniendo ‘sujeto a otros términos’.”	1) “Pagos debidos salvo incumplimiento persistente” (calificador distinto de “material no subsanado”). 
 2) “Pagos solo se suspenden tras laudo firme” (condicionar a decisión definitiva). 
 3) “Eliminar ‘sujeto a otros términos’ del Acuerdo.” 
 4) “Reconocimiento de pay-or-play no pactado en Exhibit A.” 
 5) “Pagos obligatorios aunque exista incumplimiento no material.” 
 6) “Pagos pese a incumplimiento subsanable mientras se discute.” [21] 
 7) “Pagos incondicionales una vez emitida PO.” [22] 
 8) “Calificador ‘incumplimiento confirmado judicialmente’.” [23] 
 9) “Calificador ‘incumplimiento reiterado/persistente’.” [24] 
 10) “Pagos no afectados por suspensión/Extensión.” [25] 
 11) “Pagos garantizados sin relación a desempeño.” [26] 
 12) “Renuncia de Amazon a compensaciones/deducciones por incumplimiento.” [2] 
 13) “Prohibición de retenciones legales.” [16] 
 14) “Pagos adelantados irrevocables sin causales de suspensión.” [27] 
 15) “Remoción de vínculo con Exhibit A.” [28] 
 16) “Cláusula que convierte todos pagos en ‘no reembolsables’ ante incumplimiento.” 
 17) “Limitación de causal de suspensión a dolo exclusivamente.” 
 18) “Obligación de pagar aun con rescisión por causa.” 
 19) “Pago condicionado a ‘confirmación externa’ de incumplimiento.” 
 20) “Pago garantizado aunque Amazon no pueda explotar el Programa.”
Créditos y obligaciones frente a terceros	1) “Amazon usará esfuerzos razonables para informar a terceros con los que tenga privity de las obligaciones de crédito; Amazon no será responsable por incumplimiento de dichos terceros.” [4] 
 2) “El fallo inadvertido de Amazon al otorgar crédito no constituye incumplimiento; tras aviso, corregirá prospectivamente.” [2] 
 3) “Créditos sujetos a discreción de Amazon salvo lo especificado.” [29] 
 4) “Créditos conforme a Exhibit A si no hay incumplimiento material no subsanado.” 
 5) “Amazon no garantiza ni hace cumplir créditos frente a terceros.” 
 6) “Reconocimiento de requisitos gremiales/union cuando apliquen.” [30] 
 7) “Crédito de ProdCo condicionado a completar servicios.” [22] 
 8) “Correcciones prospectivas tras notificación escrita de ProdCo.” [2] 
 9) “Sin responsabilidad de Amazon por acciones de terceros ajenos.” 
 10) “Alcance de obligaciones limitado a terceros con privity.” [4] 
 11) “Créditos no constituyen aprobación de contenido.” [31] 
 12) “Amazon puede determinar forma y tamaño del crédito salvo lo pactado.” [29] 
 13) “Crédito en medios a discreción operativa de Amazon conforme parámetros.” [29] 
 14) “No hay compensaciones por errores de crédito inadvertidos más allá de corrección.” [31] 
 15) “Créditos supeditados a políticas de branding de Amazon.” [29] 
 16) “Créditos sujetos a disponibilidad técnica de plataformas.” [31] 
 17) “Créditos localizados según prácticas de territorio.” [29] 
 18) “Créditos no transferibles ni acumulativos.” 
 19) “Créditos no exigibles en medios de terceros sin privity.” 
 20) “Créditos no crean relación de agencia o joint venture.”	1) “Amazon obligará contractualmente a terceros con los que tenga privity respecto a créditos, sin obligación de policía ni responsabilidad por su cumplimiento.” [32] 
 2) “Añadir un SLA de corrección prospectiva razonable tras notificación.” 
 3) “Prever un proceso de revisión previa de materiales de crédito a solicitud de ProdCo.” 
 4) “Incluir formato mínimo de crédito donde sea factible técnicamente.” 
 5) “Referencia a guías de marca aplicables entregadas por Amazon.” 
 6) “Mencionar que créditos estarán sujetos a prácticas de plataforma.” 
 7) “Reconocer excepciones por restricciones regulatorias específicas.” 
 8) “Aclarar que Amazon informará a distribuidores en cadenas designadas.” [4] 
 9) “Permitir un período de transición para actualizar créditos en relanzamientos.” [2] 
 10) “Prever una nota en metadata como corrección alternativa.” [4] 
 11) “Establecer idioma de crédito conforme al territorio principal.” [29] 
 12) “Incluir validación de ortografía de nombres de ProdCo.” [33] 
 13) “Admitir un listado anexo de terceros en privity para trazabilidad.” [34] 
 14) “Confirmar que créditos no confieren derechos editoriales a ProdCo.” [31] 
 15) “Permitir excepciones por limitaciones de carácter legal de terceros.” [35] 
 16) “Aclara que el crédito no aplica en anuncios de duración inferior definida.” [31] 
 17) “Permitir ubicación alternativa del crédito en materiales digitales.” [29] 
 18) “Mencionar que el crédito no implica patrocinio de terceros.” [4] 
 19) “Agregar obligación de notificación a prodcos subcontratadas.” [4] 
 20) “Referenciar guías de producción/Development Kickoff Packet para estándares.” [36]
1) “Amazon garantiza el cumplimiento de créditos por cualquier tercero.” [4] 
 2) “Amazon responderá por incumplimiento de créditos de cualquier tercero, tenga o no privity.” [4] 
 3) “Amazon deberá hacer cumplir créditos en tribunales frente a terceros.” [4] 
 4) “Extender obligaciones a todos los terceros en la cadena, sin límite.” [4] 
 5) “Indemnización a cargo de Amazon por fallos de crédito de terceros.” [11] 
 6) “Créditos automáticos no sujetos a condiciones.” [2] 
 7) “Derecho de ProdCo a penalidades si terceros fallan en créditos.” [4] 
 8) “Amazon asumirá costos de reclamaciones por créditos de terceros.” [4] 
 9) “Obligación de policía sobre terceros.” [37] 
 10) “Obligación de auditar a todos los distribuidores respecto a créditos.” 
 11) “Garantía de cumplimiento de guild/union por parte de terceros.” 
 12) “Créditos irrevocables aun si no hay privity.” 
 13) “Créditos preferentes por encima de marcas de Amazon.” 
 14) “Derecho de veto de ProdCo sobre ubicación del crédito.” 
 15) “Obligación de dar crédito en medios de terceros no controlados.” 
 16) “Compromiso de compensación económica por cualquier error de crédito.” 
 17) “Cláusula de rescisión por fallos de crédito de terceros.” 
 18) “Compromiso de litigar frente a cada incumplimiento de crédito.” [4] 
 19) “Garantía de crédito destacado en toda publicidad de terceros.” [4] 
 20) “Extender créditos a sublicenciatarios no vinculados contractualmente con Amazon.” [38]

Representaciones y garantías de ProdCo	1) “El Programa y los Materiales son originales, no infringen derechos de terceros ni vulneran privacidad u otros derechos y no están sujetos a cargas o intereses de terceros.” [39] 
 2) “Excepción únicamente para materiales suministrados por Amazon o a petición/dirección expresa de Amazon.” [39] 
 3) “Sin calificadores de conocimiento en no infracción ni ausencia de gravámenes.” [39] 
 4) “Cumplirá con leyes aplicables, incluidas sanciones, anti-boicot, exportación/reexportación y normas contra la evasión fiscal.” [40] 
 5) “Cumplirá con las políticas, requisitos y guías de Amazon de las que sea informado previamente, incluido el Development Kickoff Packet.” [40] 
 6) “Tiene plena capacidad y derecho para celebrar y ejecutar el Acuerdo.” [41] 
 7) “Las obligaciones de cumplimiento legal se formulan de manera no mutuamente condicionada.” [9] 
 8) “Cubre materiales previamente creados para el Programa.” [42] 
 9) “Ausencia de difamación en el contenido.” [43] 
 10) “Abarca universo de medios ahora conocidos o por conocerse.” [44] 
 11) “Incluye resultados y productos del trabajo.” [45] 
 12) “Reconoce que Amazon es titular exclusivo de derechos.” [46] 
 13) “No introduce reservas sobre obra por encargo.” [47] 
 14) “No condiciona a seguros E&O para exonerar responsabilidad de ProdCo.” [48] 
 15) “No limita a dolo o culpa grave.” 
 16) “Incluye obligación de adherir a guías que se comuniquen en adelante.” [49] 
 17) “No excluye jurisdicciones específicas de cumplimiento.” [50] 
 18) “No limita la obligación por ‘uso razonable’ como defensa previa.” [51] 
 19) “No relega responsabilidad por subcontratistas.” [10] 
 20) “No subordina la R&G a aprobación editorial.” [52]
1) “Eliminar referencias a reimportación/reexportación cuando no aplican, con aprobación legal.” [36] 
 2) “Eliminar mención a anti-boicot si no aplica, con aprobación legal.” [36] 
 3) “Precisar que las políticas de Amazon serán comunicadas con antelación suficiente.” [36] 
 4) “Añadir enlace o referencia al Development Kickoff Packet.” [36] 
 5) “Sustituir ‘cumplirá con’ por ‘contará con medidas diseñadas para asegurar cumplimiento’ en marco mutuo, con aprobación.” [9] 
 6) “Reubicar la R&G de políticas en un anexo de guías de producción sin degradar obligación.” [36] 
 7) “Aclarar que leyes listadas son ejemplos no limitativos.” [36] 
 8) “Incluir obligación de actualizar certificaciones de cumplimiento a solicitud razonable.” [36] 
 9) “Reconocer excepciones específicamente autorizadas por Amazon por escrito.” [36] 
 10) “Permitir plazo razonable para adaptar procesos a nuevas políticas comunicadas.” [36] 
 11) “Insertar compromiso de formación interna sobre políticas de Amazon.” [36] 
 12) “Mencionar que subcontratistas quedarán sujetos a obligaciones equivalentes.” [53] 
 13) “Prever mecanismo de notificación de potenciales conflictos de derechos.” [53] 
 14) “Aclarar que ‘público dominio’ se interpreta conforme ley aplicable.” [54] 
 15) “Incluir que R&G no limita obligaciones de indemnidad.” [10] 
 16) “Refinar definición de ‘Materiales’ para evitar ambigüedades.” [42] 
 17) “Prever cooperación en clearance documental.” [10] 
 18) “Añadir obligación de mantener registros de cadena de títulos.” [53] 
 19) “Comprometer pólizas E&O como respaldo sin limitar responsabilidad.” [48] 
 20) “Permitir actualización de R&G para temporadas adicionales mediante adenda.” [10]
1) “A su leal saber y entender, los Materiales no infringen…” (calificador de conocimiento). [55] 
 2) “Los Materiales podrían estar sujetos a reclamaciones no conocidas a la fecha.” [39] 
 3) “Excluir la garantía de ausencia de gravámenes/cargas.” [56] 
 4) “Limitar cumplimiento legal a normas laborales locales únicamente.” [57] 
 5) “Condicionar cumplimiento de políticas de Amazon a entrega ‘por escrito’ exclusivamente, eliminando comunicación oral.” [58] 
 6) “Excluir cumplimiento de sanciones/anti-boicot por considerarlas extraterritoriales.” [57] 
 7) “Reservar derechos morales no renunciables sin compromiso de no ejercicio.” [54] 
 8) “Limitar R&G a dolo o culpa grave de ProdCo.” [55] 
 9) “Excluir materiales ‘preexistentes’ del alcance sin cesión/licencia a Amazon.” [59] 
 10) “Introducir copropiedad sobre Materiales del Programa.” [60] 
 11) “Limitar la R&G solo al período de producción.” [61] 
 12) “Condicionar ‘no difamación’ a estándar de audiencia local.” [62] 
 13) “Excluir responsabilidad por subcontratistas.” [63] 
 14) “Subordinar no infracción a cobertura del seguro E&O.” [64] 
 15) “Excluir plataformas futuras ‘por conocerse’.” [47] 
 16) “Introducir reservas de terceros no identificados.” [61] 
 17) “Restringir obligaciones a contenidos ‘principalmente originales’.” [62] 
 18) “Excluir responsabilidad por derechos de imagen.” [61] 
 19) “Limitar la R&G a materiales que se emitan efectivamente.” [65] 
 20) “Condicionar obligaciones a aprobación editorial de Amazon.” [66]

Representaciones y garantías de Amazon	1) “Amazon declara y garantiza que tiene pleno derecho y facultad para celebrar y ejecutar este Acuerdo.” [8] 
 2) “Cláusula limitada de capacidad insertada antes de la indemnidad de ProdCo.” [52] 
 3) “Sin otras R&G de Amazon fuera de las expresamente contempladas.” [52] 
 4) “R&G de Amazon no altera control final del Programa.” [67] 
 5) “No se incorporan garantías sobre contenido o E&O.” 
 6) “No se amplía a garantías de explotación o resultados.” 
 7) “R&G no crea derechos de terceros.” 
 8) “No se convierte en base para limitar indemnidad de ProdCo.” 
 9) “No conlleva obligación de financiar más allá de lo pactado.” 
 10) “No implica conformidad con todas leyes locales de emisión.” 
 11) “No incluye garantías de comerciabilidad o idoneidad.” 
 12) “Sin garantías de no infracción respecto a contenidos aportados por ProdCo.” 
 13) “No supone asunción de obligaciones de clearance.” 
 14) “No altera titularidad exclusiva de Amazon.” 
 15) “No confiere derechos de veto a ProdCo.” 
 16) “No crea obligaciones de publicidad específicas.” 
 17) “No garantiza éxito comercial.” 
 18) “No asegura compatibilidad tecnológica.” 
 19) “No da lugar a garantías implícitas.” 
 20) “No condiciona la gobernanza del acuerdo.”	1) “Cada parte contará con medidas diseñadas para asegurar cumplimiento de leyes aplicables.” [9] 
 2) “Cada parte cumplirá materialmente con leyes aplicables; formulación mutua.” [9] 
 3) “La mutua se inserta como alternativa cuando se solicita bilateralidad.” [68] 
 4) “La mutua no incorpora garantías adicionales de contenido.” [10] 
 5) “Se mantiene la ubicación cerca de la indemnidad, con aprobación.” [69] 
 6) “Se limita a ‘materialmente’ para Amazon, con aprobación.” [70] 
 7) “Se evita duplicidad con otras cláusulas de cumplimiento.” [71] 
 8) “Se preserva que la mutua no afecta obligaciones de ProdCo.” [12] 
 9) “Se clarifica que el terreno es cumplimiento normativo, no técnico.” [9] 
 10) “Se excluyen garantías de resultado.” [72] 
 11) “Se excluye cualquier promesa de licencias a terceros.” [73] 
 12) “Se precisa que no modifica derecho aplicable ni jurisdicción.” [50] 
 13) “Se limita a leyes listadas a modo ejemplificativo.” [74] 
 14) “Se permite referencia a sanciones/anti-boicot si aplica.” [75] 
 15) “Se incorpora sin crear terceros beneficiarios.” [73] 
 16) “No implica obligación de reportes periódicos.” 
 17) “No subordina cumplimiento a certificaciones externas.” 
 18) “No impone auditorías cruzadas.” 
 19) “Evita lenguaje que implique supervisión de ProdCo a Amazon.” 
 20) “Se mantiene separada de la indemnidad de Amazon.”	1) “Amazon garantiza que el Programa no infringe derechos.” [65] 
 2) “Amazon garantiza la originalidad de los Materiales.” [61] 
 3) “Amazon garantiza cumplimiento de todas las leyes en todas las jurisdicciones.” [76] 
 4) “Garantía de que Amazon obtendrá todas las autorizaciones de terceros.” [77] 
 5) “Garantía de resultados de explotación.” [77] 
 6) “Garantía de ausencia de reclamaciones de terceros.” [61] 
 7) “Garantía de idoneidad técnica o comerciabilidad.” [8] 
 8) “Garantía de emisión en territorios específicos.” [50] 
 9) “Garantía de mantenimiento de niveles de marketing.” [19] 
 10) “Garantía de créditos incondicionales.” [4] 
 11) “Compromiso de E&O a favor de ProdCo como garantía.” [48] 
 12) “Garantía de asunción de clearance legal por Amazon.” [11] 
 13) “Garantía de indemnidad por cualquier incumplimiento legal de ProdCo.” [10] 
 14) “Garantía de que no habrá cambios de políticas.” [78] 
 15) “Garantía de privity universal con terceros.” [4] 
 16) “Garantía de permanencia de personal.” [18] 
 17) “Garantía de continuidad de negocio absoluto.” [18] 
 18) “Garantía de disponibilidad de plataformas.” [18] 
 19) “Garantía de financiación adicional automática.” [11] 
 20) “Garantía de que Amazon no asignará el contrato.” [79]

Indemnidad de ProdCo	1) “ProdCo indemnizará, defenderá (a opción de Amazon) y mantendrá indemne a Amazon, sus cesionarios, licenciatarios y afiliadas por pérdidas derivadas de reclamaciones de terceros relacionadas con el desarrollo y producción del Programa.” [71] 
 2) “Incluye incumplimiento o supuesto incumplimiento de obligaciones, R&G de ProdCo.” [80] 
 3) “Incluye negligencia o dolo de ProdCo.” [81] 
 4) “Defensa a opción de Amazon sin perjuicio de cobertura de seguros.” [82] 
 5) “Cubre materiales previamente creados para el Programa.” [83] 
 6) “Alcance a universo de medios y modos de explotación.” [84] 
 7) “No está condicionada a determinación judicial previa.” [85] 
 8) “Se activa con reclamaciones de terceros.” [86] 
 9) “Incluye costos, gastos y sentencias.” [87] 
 10) “No limita a cuantías específicas fuera de pólizas.” 
 11) “No excluye subcontratistas de ProdCo.” 
 12) “Opera sin perjuicio de otros recursos.” 
 13) “Compatible con control de defensa por Amazon.” 
 14) “No exige culpa grave para activar.” 
 15) “No condiciona a subsanación previa del incumplimiento.” 
 16) “No supedita a existencia de seguro.” 
 17) “Incluye reclamaciones por difamación y privacidad.” 
 18) “Incluye infracción de PI.” 
 19) “Se mantiene separada de indemnidad de Amazon.” 
 20) “No crea derechos de terceros más allá de los indemniados.” [73]
1) “Suprimir ‘supuesto’ antes de ‘incumplimiento’ sin que sea preferible; no es deal-breaker.” 
 2) “Definir procedimiento de notificación sin que el retraso libere, salvo perjuicio material.” [82] 
 3) “Reconocer derecho de ProdCo a participar en la defensa a su costo y con su abogado, sin interferir.” [68] 
 4) “Aclarar que Amazon no podrá acordar un settlement que imponga obligaciones a ProdCo sin su aprobación no irrazonable.” [69] 
 5) “Incluir lista ejemplificativa de pérdidas cubiertas.” [71] 
 6) “Permitir coordinación con aseguradoras E&O.” [82] 
 7) “Precisar que la defensa a opción de Amazon no elimina el deber de indemnizar.” [69] 
 8) “Establecer cauces de intercambio de información razonables.” [88] 
 9) “Prever cooperación de ProdCo en la defensa.” [88] 
 10) “Matizar que la participación de ProdCo no crea control conjunto.” [89] 
 11) “Reconocer límites de pólizas como fuente de recuperación adicional.” [52] 
 12) “Permitir designación de counsel sujeto a aprobación de Amazon.” [90] 
 13) “Concretar foros de negociación de settlement cuando aplique.” [82] 
 14) “Alinear definiciones de ‘Reclamación de tercero’ con resto del contrato.” [91] 
 15) “Integrar carve-outs de conflictos de interés en defensa.” [69] 
 16) “Prever reporting periódico de estado de la reclamación.” [88] 
 17) “Definir custodia de evidencia.” [82] 
 18) “Armonizar monedas/costeo de defensa internacional.” [18] 
 19) “Prever transición de defensa al cierre de la reclamación.” [91] 
 20) “Aclarar que la falta de notificación oportuna solo libera si hay perjuicio material.” [91]
1) “Eliminar obligación de ‘defender’, dejando solo ‘indemnizar’.” [10] 
 2) “Limitar indemnidad a dolo exclusivo de ProdCo.” [52] 
 3) “Exigir sentencia firme que acredite incumplimiento antes de defender/indemnizar.” [82] 
 4) “Excluir reclamaciones por infracción de PI.” [39] 
 5) “Excluir difamación y vulneración de privacidad.” [39] 
 6) “Excluir materiales previamente creados.” [39] 
 7) “Limitar a pérdidas directas excluyendo costas.” [10] 
 8) “Someter la activación a cobertura previa de seguro E&O.” [48] 
 9) “Excluir subcontratistas de ProdCo de la cobertura.” [52] 
 10) “Imponer que Amazon comparta control de defensa.” [92] 
 11) “Exigir aprobación previa de ProdCo para designar counsel de defensa.” [69] 
 12) “Limitar cuantitativamente la indemnidad por debajo del riesgo.” [52] 
 13) “Introducir franquicias o deducibles a favor de ProdCo.” [52] 
 14) “Exigir que Amazon pruebe culpa antes de aceptar defensa.” [93] 
 15) “Excluir ‘pérdidas’ definidas como costos internos de Amazon.” [71] 
 16) “Excluir licenciatarios/cesionarios/afiliadas de los indemniados.” [52] 
 17) “Excluir reclamaciones durante fase de desarrollo.” [91] 
 18) “Restringir a territorio local únicamente.” [14] 
 19) “Imponer plazos de caducidad irrazonables.” 
 20) “Excluir obligaciones surgidas por incumplimiento ‘supuesto’.” [10]

Indemnidad de Amazon	1) “Amazon indemnizará, defenderá y mantendrá indemne a ProdCo y sus afiliadas por pérdidas derivadas de reclamaciones de terceros relacionadas con distribución, marketing, publicidad y explotación del Programa.” [52] 
 2) “Se incluye ‘y todos los derechos accesorios’ en y sobre el Programa.” [11] 
 3) “No incluye ‘sucesores’ ni ‘cesionarios’ de ProdCo.” [52] 
 4) “Excluye pérdidas por las que ProdCo deba indemnizar.” [52] 
 5) “Cubre actos de Amazon o sus afiliadas en explotación.” [11] 
 6) “Opera frente a reclamaciones de terceros.” [11] 
 7) “Incluye costos y gastos razonables.” [11] 
 8) “No se extiende a contenido aportado por ProdCo fuera de alcance de Amazon.” [52] 
 9) “No condiciona defensa al consentimiento de ProdCo salvo cuando se le impongan obligaciones.” [94] 
 10) “Armonizada con control de defensa por Amazon.” [82] 
 11) “No crea doble cobertura con pólizas redundantes.” [52] 
 12) “Separa claramente los triggers de cada indemnidad.” [91] 
 13) “No limita jurisdicciones de reclamaciones.” [50] 
 14) “Mantiene coherencia con definiciones de ‘Pérdidas’.” [71] 
 15) “Evita conflictos con limitaciones de daños.” [95] 
 16) “Incluye publicidad como actividad cubierta.” [11] 
 17) “Incluye marketing como actividad cubierta.” [11] 
 18) “Incluye distribución como actividad cubierta.” [11] 
 19) “Incluye explotación en múltiples medios.” [11] 
 20) “No altera derechos de control del Programa.” [67]
1) “Añadir directores, oficiales, empleados o representantes de ProdCo como indemniados, manteniendo exclusión de ‘cesionarios/sucesores’.” [52] 
 2) “Incluir gatillo adicional por incumplimiento de Amazon con aprobación legal.” [52] 
 3) “Precisar que la cobertura no alcanza reclamaciones imputables a ProdCo.” [52] 
 4) “Definir procedimiento de notificación coherente con la mutual.” [91] 
 5) “Incluir coordinación con aseguradoras.” [82] 
 6) “Aclarar alcance territorial por razones fiscales sin reducir cobertura.” [15] 
 7) “Permitir participación de ProdCo en defensa a su costo.” [68] 
 8) “Alinear definiciones de ‘Reclamación de tercero’.” [96] 
 9) “Prever cooperación razonable de ProdCo en la defensa.” [88] 
 10) “Precisar que no se indemniza si la causa exclusiva es incumplimiento de ProdCo.” [52] 
 11) “Establecer que no hay obligación de policía sobre terceros.” [5] 
 12) “Reconocer límites de pólizas como referencia informativa.” [10] 
 13) “Ajustar moneda de gastos para conciliación contable.” [18] 
 14) “Definir intercambio de información relevante.” [88] 
 15) “Confirmar que la inclusión de ‘derechos accesorios’ no altera licencias.” [11] 
 16) “Señalar que la cláusula no crea terceros beneficiarios adicionales.” [73] 
 17) “Detallar que publicidad cubierta es la realizada por Amazon.” [19] 
 18) “Incluir que explotación cubierta es la realizada por Amazon/Afiliadas.” [11] 
 19) “Matizar que no cubre actos de terceros sin privity.” [4] 
 20) “Armonizar con la renuncia a daños indirectos donde proceda.” [97]
1) “Extender indemniados a ‘cesionarios’ o ‘sucesores’ de ProdCo.” [52] 
 2) “Obligación de Amazon de indemnizar por cualquier incumplimiento de ProdCo.” [52] 
 3) “Indemnidad por cualquier actuación de terceros ajenos a Amazon.” [71] 
 4) “Cobertura de pérdidas propias de ProdCo no vinculadas a reclamaciones de terceros.” [71] 
 5) “Exigir que Amazon garantice la defensa por counsel elegido por ProdCo.” [68] 
 6) “Imponer obligación de policía de terceros a Amazon.” [4] 
 7) “Incluir reclamaciones por contenido creado y controlado por ProdCo.” [61] 
 8) “Añadir garantía de cobertura ilimitada sin exclusiones.” [71] 
 9) “Hacer solidaria la responsabilidad por reclamaciones de terceros atribuibles a ProdCo.” [11] 
 10) “Vincular la indemnidad a cualquier pérdida indirecta sin límites.” [97] 
 11) “Exigir aprobación de ProdCo para toda estrategia de defensa.” [69] 
 12) “Extender a cualquier incumplimiento contractual menor de Amazon sin causal de reclamación de tercero.” [52] 
 13) “Cubrir actos de sublicenciatarios de terceros no vinculados contractualmente.” [11] 
 14) “Incluir responsabilidad por fallos de crédito de terceros.” [4] 
 15) “Extender a daños punitivos sin considerar limitaciones contractuales.” [97] 
 16) “Imponer reembolso de costos internos de ProdCo sin relación con defensa.” [71] 
 17) “Cobertura de multas administrativas por actos de ProdCo.” [71] 
 18) “Cubrir reclamaciones fuera del ámbito de explotación.” [11] 
 19) “Exigir indemnidad por decisiones editoriales de Amazon aprobadas por ProdCo.” [69] 
 20) “Convertir la indemnidad en garantía de resultado de explotación.”
Defensa y resolución de reclamaciones	1) “El indemnitario notificará prontamente, y el retraso solo libera si perjudica materialmente la defensa.” [91] 
 2) “Amazon tendrá la opción de controlar la defensa y el settlement de cualquier reclamación.” [82] 
 3) “ProdCo cooperará razonablemente y aportará información y asistencia.” [88] 
 4) “ProdCo puede participar en la defensa a su costo con su propio counsel.” [68] 
 5) “Amazon no celebrará un acuerdo que imponga obligaciones a ProdCo sin su aprobación no irrazonable.” [69] 
 6) “El control por Amazon no elimina obligación de indemnizar/defender.” [94] 
 7) “La notificación será escrita.” [98] 
 8) “Los derechos de participación de ProdCo no interfieren con el control de Amazon.” [88] 
 9) “Se documentará el intercambio de información relevante.” 
 10) “Se preservan privilegios y confidencialidad.” [58] 
 11) “Se permite designar counsel adecuado a la materia.” [68] 
 12) “Se pueden consolidar reclamaciones relacionadas.” [82] 
 13) “Se definen criterios de settlement razonables.” [69] 
 14) “Se establecen canales de comunicación designados.” [88] 
 15) “Se coordinan aseguradoras cuando existan.” [11] 
 16) “Se mantienen registros de costos y avances.” [99] 
 17) “Se trata la subrogación conforme a pólizas.” [71] 
 18) “Se prevé transición adecuada post-cierre.” [18] 
 19) “Se respeta el interés de Amazon en la reputación.” [19] 
 20) “Se alinean foros con la cláusula de ley aplicable.”	1) “Añadir que Amazon no podrá acordar admisiones de culpa de ProdCo sin aprobación previa no irrazonable.” [69] 
 2) “Prever plazos razonables para revisar borradores de settlement.” [88] 
 3) “Establecer hitos de reporte de defensa al indemnitario.” [68] 
 4) “Designar un comité de coordinación para reclamaciones complejas.” [82] 
 5) “Definir criterios de selección de peritos periciales.” [88] 
 6) “Permitir cambio de counsel por conflicto de interés.” [100] 
 7) “Ajustar idioma de la defensa en jurisdicciones locales.” [82] 
 8) “Prever mediación previa si no afecta urgencia procesal.” [82] 
 9) “Definir canal seguro de intercambio de documentos.” [88] 
 10) “Establecer métricas de tiempos de respuesta.” 
 11) “Permitir participación remota en audiencias cuando proceda.” 
 12) “Acordar pauta de comunicación pública durante litigio.” 
 13) “Regular conservación de evidencia digital.” 
 14) “Prever coordinación multi-jurisdiccional.” 
 15) “Definir criterios de confidencialidad ampliada.” 
 16) “Alinear reservas contables de pérdidas con IFRS/US GAAP sin obligar a reconocer responsabilidades.” 
 17) “Permitir auditoría de costos externos razonables.” 
 18) “Fijar umbrales de autorización interna para settlement.” 
 19) “Incluir procedimiento de objeción a acuerdos que impongan obligaciones a ProdCo.” 
 20) “Reconocer que la participación de ProdCo no constituye renuncia a defensas.” [92]
1) “Imponer que Amazon no pueda controlar la defensa.” [82] 
 2) “Exigir aprobación previa de ProdCo para cualquier paso de defensa.” [101] 
 3) “Establecer que la omisión de notificación libera automáticamente al indemnizador.” [85] 
 4) “Imponer que la defensa sea dirigida por counsel de ProdCo.” [68] 
 5) “Otorgar a ProdCo derecho de veto general sobre settlement.” [101] 
 6) “Restringir a Amazon de llegar a acuerdos sin causa.” [101] 
 7) “Exigir co-control de defensa por defecto.” [88] 
 8) “Imponer plazos de respuesta imposibles que afecten la defensa.” [85] 
 9) “Obligar a divulgar comunicaciones privilegiadas sin salvaguardas.” [88] 
 10) “Permitir a ProdCo instruir peritos y estrategia sin consenso.” [94] 
 11) “Condicionar el control de defensa a asunción previa de responsabilidad.” [82] 
 12) “Imponer reglas que contradicen la póliza de seguro aplicable.” [51] 
 13) “Establecer foros de defensa distintos a los de ley aplicable.” [28] 
 14) “Convertir los reportes en condición de cobertura.” [102] 
 15) “Exigir autorización de ProdCo para designar cualquier counsel.” [101] 
 16) “Limitar el uso de settlement sin base razonable.” [88] 
 17) “Imponer métricas punitivas por decisiones estratégicas.” [71] 
 18) “Forzar publicación de acuerdos confidenciales.” [103] 
 19) “Otorgar a terceros derechos de control.” [73] 
 20) “Imponer auditoría irrestricta de comunicaciones de defensa.”

Notas: Los ejemplos reproducen patrones y términos del Playbook DSA y las guías de fallbacks del PSA. “Pasable” supone, cuando se ha indicado, la aprobación de Legal de Amazon. Los textos se redactan en español conservando el sentido normativo original en inglés.
Guía práctica de uso del playbook en revisión
La matriz debe emplearse como un clasificador de patrones al comparar un contrato tercero con la política de Amazon. Una formulación que coincida con ejemplos de la columna “Aceptables” puede aceptarse en vía ordinaria, documentando la coincidencia y pasando a verificación de coherencia con el resto del documento. Cuando el texto encaja con “Pasables”, la recomendación es proponer el fallback exacto reflejado en los materiales o elevar para aprobación de Amazon Legal cuando así se señala. Si el texto coincide con “No aceptables”, debe redactarse una contraoferta apoyada en el ejemplo “Aceptable” correspondiente, o bien sustituirse por la redacción estándar de Amazon.
El sistema RAG puede indexar los ejemplos como embeddings por categoría y nivel de aceptación, multiplicando la precisión de recuperación por proximidad semántica. En la práctica, conviene normalizar términos clave como “incumplimiento material no subsanado”, “esfuerzos razonables”, “a opción de Amazon”, “reclamaciones de terceros” y “derechos accesorios”, que funcionan como anclas semánticas del riesgo.
Riesgos, banderas rojas y criterios de escalamiento
Las banderas rojas más frecuentes se concentran en intentos de introducir calificadores no permitidos sobre incumplimiento en secciones de pago o créditos, imponer a Amazon responsabilidad por terceros fuera de su privity, añadir calificadores de conocimiento a representaciones de ProdCo, suprimir la obligación de defensa en indemnidades, extender los indemniados de Amazon a cesionarios/sucesores de ProdCo, y limitar el control de defensa por Amazon más allá de los matices permitidos. Siempre que aparezcan, deben sustituirse por las formulaciones “Aceptables” o reconducirse a “Pasables” que requieren aprobación específica. [5]
En escenarios complejos, resulta prudente escalar a Amazon Legal cuando se proponga una indemnidad de Amazon por su propio incumplimiento o cuando se pretenda convertir obligaciones de crédito en garantías ejecutables frente a terceros. [104] También debe elevarse cuando se soliciten mutuas de cumplimiento legal extensivas o cuando una modificación impacte la interacción con pólizas E&O. [91]
Extensiones y próximos pasos
Este dataset puede y debe ampliarse con más tipologías recogidas en los materiales adjuntos, incluyendo confidencialidad y publicidad, renuncia a daños indirectos y a medidas cautelares, cesión, suspensión/extensión por fuerza mayor y litigios, documentación y poderes, protección de datos, impuestos/retenciones y ley/jurisdicción. [20] La misma técnica de ejemplos permite completar las 20 variantes por celda para cada tipología adicional. [73] Si lo desea, preparo en una segunda entrega la “Parte 2” con dichas categorías, manteniendo la granularidad y el criterio de aceptación descritos. [105]
Conclusión
El playbook presentado ofrece una matriz estructurada y operativa que traduce la política contractual de Amazon, tal como se refleja en el Playbook DSA y en la guía de fallbacks del PSA, en 120 ejemplos por tipología que un sistema RAG puede aprovechar de inmediato. La clasificación entre “Aceptables”, “Pasables” y “No aceptables” facilita decisiones rápidas de redacción, negociación y escalamiento, disminuyendo asimetrías de información y tiempos de ciclo. Persisten márgenes de aprobación legal en ciertos “Pasables” que los documentos señalan de forma explícita; el equipo revisor debe respetar esos umbrales. Para una cobertura completa del ciclo contractual, proponemos ampliar la matriz a las tipologías restantes en una segunda fase, manteniendo la consistencia terminológica y el anclaje estricto en los materiales adjuntos.

La diferencia central es que una cláusula “Pasable” es un desvío controlado frente al estándar de Amazon que puede admitirse como fallback (a menudo con aprobación de Legal), mientras que una cláusula “Aceptable” ya está alineada con la posición estándar o con desvíos expresamente permitidos sin escalamiento. Esta distinción se usa en el playbook para separar lo que se aprueba en vía ordinaria de lo que requiere condiciones o revisión adicional, sin traspasar las anclas de riesgo de Amazon.
Comparación operativa: “Aceptable” vs “Pasable”
Aspecto	Aceptable	Pasable
Definición	Redacción alineada con el estándar de Amazon o con desvíos explícitamente permitidos sin necesidad de aprobación adicional.	Desvío razonable que no traslada riesgo material a Amazon y que está contemplado como concesión condicionada o sujeta a aprobación de Legal.
Impacto de riesgo	Mantiene intactas las anclas de riesgo de Amazon (p. ej., “incumplimiento material no subsanado”, control de defensa, no privity con terceros).	Ajuste de forma o procedimiento que no altera el reparto sustantivo del riesgo ni las anclas; cualquier ampliación de riesgo queda fuera.
Necesidad de aprobación	No requiere aprobación de Legal (salvo casos puntuales ya previstos como permitidos).	Normalmente requiere “aprobación de Amazon Legal” y se usa como fallback de negociación documentado.
Ejemplos típicos	Pagos sujetos a Exhibit A y a “incumplimiento material no subsanado”; control de defensa por Amazon; créditos sin responsabilidad por terceros fuera de privity.	Ajustes de proceso: factura electrónica, prorrateo por hitos, SLA de corrección de créditos, participación de ProdCo en defensa a su costo, mutua acotada a “medidas para asegurar cumplimiento/material compliance”.
Señal de frontera	No introduce calificadores prohibidos ni amplía responsabilidades de Amazon; no limita controles clave.	Aceptable solo si el fallback figura en los materiales y no erosiona triggers, alcance o control de Amazon; si traspasa esos límites, deja de ser “Pasable”.
Cómo usar la distinción en revisión
En la práctica, clasifique como Aceptable cualquier texto que replique el estándar o un desvío permitido sin escalamiento; clasifique como Pasable los ajustes operativos previstos como fallback y marque “requiere aprobación Legal”; rechace lo que comprometa anclas de riesgo (p. ej., calificadores distintos de “incumplimiento material no subsanado” en pagos, obligación de Amazon por terceros sin privity, eliminación del deber de defender o limitaciones al control de defensa).
A continuación te entrego prompts listos para producción para cada agente del flujo. Están redactados con separación de roles, variables parametrizables y guardrails explícitos. Incluyo la estructura recomendada de “System + Developer + Inputs + Output contract + Guardrails + Reglas de validación”. Puedes pegarlos directamente en n8n, sustituyendo las llaves {{…}} por las variables de tu orquestador.
Convenciones generales
•	Variables de entrada: usa {{variable}} para inyectar datos desde n8n/Supabase.
•	No inventar reglas: todo debe trazarse a PolicySpec y VariationSet.
•	JSON estricto: siempre responde en JSON que valide contra el schema correspondiente.
•	Idioma: interno en español; client-facing en el locale configurado.
Agente 0 (opcional si usas LLM): Clause Router
Recomendación: implementarlo determinista (vector + heurística). Si decides un LLM auxiliar, usa este prompt minimalista.
•	System
Eres un router contractual. Tu objetivo es proponer las 1–3 reglas del Playbook que mejor mapean una cláusula dada. No decides cumplimiento. No inventas reglas.
•	Developer
Devuelve únicamente JSON con los candidatos. Usa los campos: clause_id, detected_family, rule_candidates[], coverage_confidence. No uses texto libre.
•	Input
clause_id: {{clause_id}}
heading: {{clause_heading}}
clause_text: {{clause_text}}
candidate_rules_from_vector: {{json_topk_rules}}
families_catalog: {{json_families}}
•	Output
{ "clause_id": "...", "detected_family": "...", "rule_candidates": [ { "rule_id": "...", "score": 0.0 } ], "coverage_confidence": 0.0 }
•	Guardrails
- No crear rule_id nuevos.
- Si dudas, baja coverage_confidence y conserva los mejores candidatos de embeddings.
Agente 1: Analista Paranoico (alto recall)
•	System
Eres el Agente Analista Paranoico. Tu función es maximizar la cobertura de hallazgos (alto recall) sobre una cláusula específica, comparándola contra la posición estándar y variaciones de la regla activa del Playbook. No decides el estatus final ni propones redacciones nuevas. Produces evidencia con spans reproducibles (offsets exactos) y marcas cada hallazgo con una categoría tentativa.
•	Developer
Instrucciones:
1) Compara clause_text con STANDARD_POSITION y FALLBACK_ACCEPTABLE/UNACCEPTABLE de la regla activa.
2) Identifica cambios: missing/added/modified/potential_ambiguity/matches_standard.
3) Para cada hallazgo: incluye quote, offsets {start,end}, change_type, possible_category ∈ {MatchesStandard, MatchesAcceptable, MatchesUnacceptable, UnknownChange}, signal_terms[], confidence [0,1].
4) Deduplica spans superpuestos (conserva el de mayor información).
5) Devuelve JSON que valide contra ParanoidAnalyzerOutput (draft-07). No incluyas texto fuera del JSON.
•	Inputs
clause_id: {{clause_id}}
detected_family: {{detected_family}}
rule_candidates: {{json_rule_candidates}}
active_rule_id: {{rule_id}}
policy_spec: {{json_policy_spec}}  // solo la regla activa
standard_position: {{standard_text}}
acceptable_variations: {{acceptable_text_array}}
unacceptable_variations: {{unacceptable_text_array}}
variation_set_examples: {{json_variation_set_topk}}
clause_text: {{clause_text}}
•	Output contract
Debes devolver JSON válido según ParanoidAnalyzerOutput. Asegúrate de completar: clause_id, detected_family, rule_candidates, observations[], summary.counts, summary.coverage_confidence, model_info.
•	Guardrails
- No inventar reglas ni conclusiones finales.
- No proponer cambios.
- Offsets en base al clause_text exacto recibido.
- Temperatura 0; consistencia ante reintentos.
Agente 2: Valorador Conforme al Playbook (alto precision)
•	System
Eres el Agente Valorador. Tu función es convertir las observaciones del Paranoico en una decisión conforme al Playbook, proponer cambios seguros (solo texto del estándar o fallbacks aceptables) y señalar si se requiere escalamiento. Eres estricto: no introduces texto nuevo ni resuelves zonas no cubiertas por el Playbook. Prefieres escalar ante ambigüedad.
•	Developer
Instrucciones:
1) Determina final_status ∈ {Compliant, AcceptableDeviation, UnacceptableDeviation, NotCoveredByPlaybook, Ambiguous}.
2) Solo propone cambios si puedes anclarlos (anchor.quote+offsets+anchor_confidence) y si el texto proviene exactamente de STANDARD_POSITION o FALLBACK_ACCEPTABLE (source_reference con exact_text).
3) Si analysis_mode = MODE_STRICT_NO_DEVIATIONS: cualquier cambio relevante es UnacceptableDeviation.
4) Si no hay coincidencia explícita en Acceptable/Unacceptable y la regla no permite juicio: NotCoveredByPlaybook o Ambiguous (no decidas “materialidad”).
5) Rellena escalation: recommended (bool), reason ∈ {WITH_LEGAL_APPROVAL_REQUIRED, NOT_COVERED_BY_PLAYBOOK, AMBIGUOUS_POLICY_JUDGMENT, UNACCEPTABLE_DEVIATION_STRICT, LOW_CONFIDENCE_ANCHOR, LOW_CONFIDENCE_OVERALL}, routing_policy_effect.
6) Devuelve JSON válido según PlaybookValuatorOutput. Nada de texto libre.
•	Inputs
clause_id: {{clause_id}}
rule_id: {{rule_id}}
analysis_mode: {{policy_spec.analysis_mode}}
routing_policy: {{policy_spec.routing_policy}}
standard_position: {{standard_text}}
fallback_acceptable_fragments: {{acceptable_text_array}}
unacceptable_patterns: {{unacceptable_text_array}}
observations: {{json_paranoid_output.observations}}
dependencies: {{json_dependencies_graphrag}}  // definiciones/cross-refs relevantes, si aplica
clause_text: {{clause_text}}
•	Output contract
JSON PlaybookValuatorOutput completo: clause_id, rule_id, analysis_mode, final_status, proposed_changes[], escalation{…}, confidence_overall, dependencies[], audit{evidence_spans[], valuator_model}.
•	Guardrails
- Prohibido: insertar/reescribir texto que no exista en STANDARD_POSITION o FALLBACK_ACCEPTABLE.
- Si anchor_confidence < {{TH_ANCHOR}} para un cambio crítico → sugiere escalamiento con LOW_CONFIDENCE_ANCHOR.
- Si routing_policy.type = ESCALATE / ESCALATE_IF_UNACCEPTABLE y hay cambio relevante → marca escalation.recommended = true.
Agente 3: Sanitizer (client facing seguro)
•	System
Eres el Agente Sanitizer. Tu función es convertir la decisión interna en un comentario client-facing neutral y seguro, sin filtrar reglas internas, nombres de equipos, IDs, thresholds, etiquetas de política ni puntuaciones de confianza.
•	Developer
Instrucciones:
1) Redacta client_comment y client_summary_line en {{locale}} usando un tono neutro (“alinear con términos estándar”, “clarificar”, “consistencia”).
2) Aplica blocklist de términos prohibidos y genera safety.pass solo si no hay fugas.
3) No incluyas RuleName, Playbook, WITH LEGAL APPROVAL, nombres de equipos, “aceptable/inaceptable”, ni confidences.
4) Devuelve JSON válido según SanitizerOutput.
•	Inputs
clause_id: {{clause_id}}
locale: {{locale}}  // ej. "es-ES"
final_status: {{valuator_output.final_status}}
proposed_changes: {{valuator_output.proposed_changes}}
escalation: {{valuator_output.escalation}}
internal_justification: {{concise_internal_note}}  // no exponer al cliente
blocked_terms: {{json_blocklist}}  // ["Playbook", "Rule", "Guidance", "Aceptable", "Inaceptable", ...]
•	Output contract
JSON SanitizerOutput: clause_id, client_comment, client_summary_line, locale, safety{blocked_terms_detected[], leak_score, policy_leak_flags[], pass}, redactions[], model_info.
•	Guardrails
- Si se detecta un término bloqueado, reescribe automáticamente o marca safety.pass=false.
- Longitud sugerida: 1–3 frases por client_comment; 1 línea para summary.
Agentes deterministas (sin LLM)
•	Validador determinista (Code/Edge Function)
o	Verifica: no “texto nuevo”, anclas válidas, source_reference permitido, cálculo de anchor_confidence, leak-precheck preliminar.
•	Decisor/Gating (Code/Edge Function)
o	Aplica la matriz determinista definida (required, routing_policy, analysis_mode, final_status, confidences).
o	Emite: decision, escalation_queue, y contract_level_flag=BLOCK_EXPORT cuando proceda.
Parámetros recomendados (config console)
•	TH_ANCHOR: 0.85 por defecto.
•	TH_CONF_OVERALL: 0.80 (0.85 en modo Legal estricto).
•	coverage_threshold (router): 0.78.
Ejemplos breves de instanciación
•	Llamada al Paranoico (body n8n)
{
  "clause_id": "{{ $json.clause_id }}",
  "detected_family": "{{ $json.detected_family }}",
  "rule_candidates": {{ $json.rule_candidates }},
  "policy_spec": {{ $json.policy_spec }},
  "standard_position": {{ $json.policy_spec.standard_position }},
  "acceptable_variations": {{ $json.policy_spec.acceptable_variations }},
  "unacceptable_variations": {{ $json.policy_spec.unacceptable_variations }},
  "variation_set_examples": {{ $json.variation_set_examples }},
  "clause_text": {{ $json.clause_text }}
}
•	Llamada al Valorador (body n8n)
{
  "clause_id": "{{ $json.clause_id }}",
  "rule_id": "{{ $json.active_rule_id }}",
  "analysis_mode": "{{ $json.policy_spec.analysis_mode }}",
  "routing_policy": {{ $json.policy_spec.routing_policy }},
  "standard_position": {{ $json.policy_spec.standard_position }},
  "fallback_acceptable_fragments": {{ $json.policy_spec.acceptable_variations }},
  "unacceptable_patterns": {{ $json.policy_spec.unacceptable_variations }},
  "observations": {{ $json.paranoid_output.observations }},
  "dependencies": {{ $json.graph_context }},
  "clause_text": {{ $json.clause_text }}
}
•	Llamada al Sanitizer (body n8n)
{
  "clause_id": "{{ $json.valuator_output.clause_id }}",
  "locale": "{{ $json.locale }}",
  "final_status": "{{ $json.valuator_output.final_status }}",
  "proposed_changes": {{ $json.valuator_output.proposed_changes }},
  "escalation": {{ $json.valuator_output.escalation }},
  "internal_justification": "{{ $json.internal_note }}",
  "blocked_terms": {{ $json.blocklist_terms }}
}
Buenas prácticas de puesta en marcha
•	Prevalida los outputs contra los JSON Schemas antes de persistir.
•	Loggea los spans y offsets para reproducibilidad y auditoría.
•	Versiona PolicySpec y asocia cada respuesta a rule_id:version.
•	Asegura pruebas unitarias del Validador y del Decisor (incluye casos límite: anclas bajas, NotCovered/Ambiguous, routing de escalado).
Con estos prompts y convenciones tienes un flujo multiagéntico robusto, auditable y seguro, alineado con la lógica de tu Playbook y listo para orquestarse en n8n con Supabase y UI Lovable.
CopyExportRewriteOpen in editor
Rate the response
Follow-ups
¿Incluye el Agente 0 alguna lógica para manejar casos en los que no se detecten reglas candidatas?
¿Cómo determina el Agente 1 la categoría tentativa de cada hallazgo?
¿Qué acciones toma el Agente 2 si el analysis_mode es MODE_STRICT_NO_DEVIATIONS y se detecta un cambio relevante?
¿Qué sucede si el Agente 3 detecta términos bloqueados en el client_comment o client_summary_line?
Follow-ups
¿Incluye el Agente 0 alguna lógica para manejar casos en los que no se detecten reglas candidatas?
¿Cómo determina el Agente 1 la categoría tentativa de cada hallazgo?
¿Qué acciones toma el Agente 2 si el analysis_mode es MODE_STRICT_NO_DEVIATIONS y se detecta un cambio relevante?
¿Qué sucede si el Agente 3 detecta términos bloqueados en el client_comment o client_summary_line?
CopySave promptEdit query
Finished in 2 steps
A continuación doy respuestas operativas y deterministas para cada follow-up, alineadas con el pipeline y los esquemas ya definidos.
¿Incluye el Agente 0 (Clause Router) lógica para cuando no haya reglas candidatas?
Sí. El Router aplica un manejo explícito de “no cobertura”:
•	Reintento con heurísticas: si el topK vectorial no supera coverage_threshold, aplica fallback por heurística de heading/keywords y expansión de sinónimos de familia (p. ej., “indemnify/indemnización”, “fees/honorarios”).
•	Si tras el reintento no hay candidato viable:
o	rule_candidates: []
o	detected_family: se deja vacío o “DefenseSettlement” solo si el heading/keywords lo justifican con score mínimo; de lo contrario no se fuerza familia.
o	coverage_confidence: 0.0
o	Señal de routing: el subworkflow marca la cláusula como NotCovered y salta directamente al Decisor/Gating con final_status = NotCoveredByPlaybook.
•	Registro: log del motivo “NO_RULE_CANDIDATE” y los features usados (heading, keywords, n grams) para auditoría y posterior mejora del catálogo.
Pseudocódigo breve:
•	candidates = vector_search()
•	if max_score < coverage_threshold:
o	candidates = heuristic_fallback()
•	if candidates vacío:
o	emit { rule_candidates: [], coverage_confidence: 0.0 }
o	route → Decisor con NotCoveredByPlaybook
¿Cómo determina el Agente 1 (Paranoico) la categoría tentativa de cada hallazgo?
El Paranoico etiqueta cada observación con una categoría tentativa usando coincidencias textuales y soporte semántico controlado:
•	MatchesStandard:
o	Coincidencia exacta o normalizada (case/espacios/puntuación) con fragmentos del STANDARD_POSITION.
o	Confianza alta (≥0.9) si exacta; media (0.7–0.9) si normalizada.
•	MatchesAcceptable:
o	Match exacto/normalizado o con similitud semántica por encima de umbral estricto con cualquiera de los FALLBACK_ACCEPTABLE.
o	Señales clave (“a opción de Amazon”, “esfuerzos razonables”) aumentan confianza.
•	MatchesUnacceptable:
o	Presencia de patrones prohibidos (palabras/expresiones listadas en unacceptable_variations) o estructuras que amplían obligación/riesgo según el VariationSet.
o	Confianza alta si regex/patrón literal; media si paráfrasis con varios “signal_terms”.
•	UnknownChange:
o	Diferencia respecto al estándar que no mapea a aceptable/inaceptable enumerado (p. ej., sinónimos no previstos, reordenaciones sustantivas).
o	Confianza moderada (0.4–0.7); solicita verificación del Valorador.
•	potential_ambiguity:
o	Se usa cuando el span cumple simultáneamente señales de dos categorías (p. ej., acceptable y unacceptable) o depende de una definición externa; adjunta dependencies sugeridas (DefinedTerm/CrossRef).
Criterios adicionales:
•	change_type:
o	missing: ausencia de un requisito del estándar (detectado por dif/plantillas).
o	added: añadido sustantivo no presente en el estándar.
o	modified: texto estándar alterado en calificadores, sujetos, alcance o triggers.
•	confidence se calcula combinando tipo de match (exacto > normalizado > semántico), densidad de “signal_terms” y longitud del span cubierto.
¿Qué hace el Agente 2 (Valorador) si analysis_mode = MODE_STRICT_NO_DEVIATIONS y hay cambio relevante?
Aplica la regla estricta sin discreción:
•	final_status: UnacceptableDeviation para cualquier missing/added/modified sustantivo detectado.
•	proposed_changes:
o	replace/insert/delete únicamente con exact_text del STANDARD_POSITION que restaure la redacción canónica.
o	Anclaje obligatorio; si anchor_confidence ≥ TH_ANCHOR, genera AUTO_REDLINEDRAFT (sujeto luego al Decisor). Si < TH_ANCHOR, marca escalamiento.
•	escalation:
o	recommended = true
o	reason = UNACCEPTABLE_DEVIATION_STRICT si el anclaje es sólido; LOW_CONFIDENCE_ANCHOR si el anclaje es débil.
o	routing_policy_effect se rellena con el valor de la regla.
•	No emite AcceptableDeviation ni intenta juicios de “materialidad”. Cualquier desvío en modo estricto es inaceptable por definición.
Notas operativas:
•	El Validador determinista ignorará variaciones no sustantivas (whitespace/ortografía) gracias a la normalización previa; solo se consideran “relevantes” cambios que alteren alcance, triggers, sujetos, responsabilidades o calificadores.
¿Qué sucede si el Agente 3 (Sanitizer) detecta términos bloqueados?
El Sanitizer aplica un circuito de saneamiento y, si es necesario, bloqueo:
•	Auto reescritura:
o	Reemplaza tokens prohibidos por equivalentes neutros (“alinear con términos estándar”, “mantener consistencia”) y elimina IDs/versions/RuleNames.
o	Actualiza el array redactions[] con pares {from, to}.
•	Re verificación:
o	Recalcula leak_score y policy_leak_flags. Si ya no hay fugas, safety.pass = true y emite el comentario.
•	Fallo de saneamiento (tras 1–2 reintentos):
o	safety.pass = false
o	blocked_terms_detected incluye los tokens remanentes
o	No expone el comentario al cliente; marca el ítem para revisión humana y, si la regla es required con block_export, el Risk Orchestrator puede bloquear la exportación del paquete hasta resolver.
•	Restricciones:
o	Nunca envía client_comment/client_summary_line con términos bloqueados.
o	No “disfraza” contenidos internos con eufemismos que conserven semántica interna; si la reescritura neutra no es posible sin fuga, detiene la salida.
En síntesis:
•	Router: si no hay candidatos, marca NotCovered y escalará.
•	Paranoico: categoriza por coincidencia exacta/normalizada/patrón/semántica controlada con señales y confianza.
•	Valorador (modo estricto): cualquier cambio relevante → UnacceptableDeviation, propone restaurar estándar, y escala si el anclaje es débil.
•	Sanitizer: reescribe, vuelve a chequear fugas y, si persisten, no publica y envía a revisión interna.
CopyExportRewriteOpen in editor
Rate the response
Follow-ups
¿Reintenta el Router con heurísticas si el topK vectorial no supera el coverage_threshold?
¿Etiqueta el Paranoico una observación como UnknownChange si la diferencia respecto al estándar no mapea a aceptable/inaceptable enumerado?
¿Aplica el Valorador la regla estricta sin discreción si analysis_mode es MODE_STRICT_NO_DEVIATIONS y hay cambio relevante?
¿Reemplaza el Sanitizer tokens prohibidos por equivalentes neutros y elimina IDs/versions/RuleNames?
Cuantas rutas agente paranoico-Valorador hacen faltas según grupos de cláusulas?
CopySave promptEdit query
Finished in 2 steps
La respuesta corta: necesitas 9 rutas especializadas Paranoico→Valorador, una por cada “familia” de cláusulas. Cada ruta se instancia tantas veces como aparezcan cláusulas/reglas de esa familia en el contrato.
Número de rutas por grupo de cláusulas
•	Agent.PaymentCredits: 1 ruta
•	Agent.ThirdPartyCredits: 1 ruta
•	Agent.RepsProdCo: 1 ruta
•	Agent.RepsAmazon: 1 ruta
•	Agent.RepsTruthTerm: 1 ruta
•	Agent.IndemnityProdCo: 1 ruta
•	Agent.IndemnityAmazon: 1 ruta
•	Agent.DefenseSettlement: 1 ruta
•	Agent.SurvivalRemedies: 1 ruta
Total: 9 rutas Paranoico→Valorador (perfiles). Estas son “plantillas” de ruta; en tiempo de ejecución se instancian virtualmente por regla/cláusula concreta.
Cómo se instancian en la práctica
•	Cada “ruta” es el dúo Paranoico + Valorador configurado con el PolicySpec de su familia.
•	Si el contrato trae varias reglas dentro de la misma familia (p. ej., dos indemnidades, o varias R&G de ProdCo), la misma ruta se ejecuta múltiples veces, una por ClauseInstance/RuleId.
•	En un contrato típico verás 9–13 instancias totales de rutas, por ejemplo:
o	PaymentCredits: 1–2 instancias
o	ThirdPartyCredits: 1
o	RepsProdCo: 2–3
o	RepsAmazon: 1
o	RepsTruthTerm: 0–1 (solo si hay bring-down)
o	IndemnityProdCo: 1–2
o	IndemnityAmazon: 1–2
o	DefenseSettlement: 1
o	SurvivalRemedies: 1
Resumen operativo
•	Diseña 9 rutas especializadas Paranoico→Valorador (una por familia).
•	El Router asigna cada cláusula a su familia; n8n instancia la ruta correspondiente con el PolicySpec de esa regla.
•	La concurrencia se controla a nivel de instancias, no de perfiles; así mantienes costos bajos y alta especialización.
CopyExportRewriteOpen in editor
Rate the response
Follow-ups
¿Cómo se configura el PolicySpec para cada familia de cláusulas?
¿Por qué es importante mantener la concurrencia a nivel de instancias y no de perfiles?
¿Qué sucede si un contrato no incluye ninguna cláusula de una familia específica?
¿Cómo afecta la presencia de múltiples reglas dentro de la misma familia a la ejecución de las rutas?
¿Cómo se configura el PolicySpec para cada familia de cláusulas?
CopySave promptEdit query
Finished in 3 steps
A continuación detallo cómo parametrizar el PolicySpec “ejecutable” por cada familia de cláusulas. La idea es que tengas un molde uniforme, con campos obligatorios, derivados computables y perfiles de recuperación/decisión que luego el router y los agentes utilizan sin ambigüedad. Incluyo recomendaciones por familia y ejemplos de JSON listos para tu consola de configuración.
Estructura base de PolicySpec
Cada regla del playbook se compila a un objeto con campos consistentes. Recomendación mínima:
•	rule_id: PlaybookId:Version:RuleName
•	clause_family: PaymentCredits | ThirdPartyCredits | RepsProdCo | RepsAmazon | RepsTruthTerm | IndemnityProdCo | IndemnityAmazon | DefenseSettlement | SurvivalRemedies
•	required: true/false
•	standard_position: texto canónico de la cláusula (fragmentos versionados)
•	acceptable_variations: array de fallbacks explicitamente permitidos
•	unacceptable_variations: patrones o fragmentos inaceptables
•	guidance_internal: notas internas no expuestas
•	analysis_mode: MODE_STRICT_NO_DEVIATIONS | MODE_ENUMERATED_DEVIATIONS | MODE_POLICY_JUDGMENT_REQUIRED
•	retrieval_profile: vector_top_k, coverage_threshold, examples_top_k
•	routing_policy: type (AUTO_ACCEPT | ESCALATE | ESCALATE_IF_CHANGE | ESCALATE_IF_UNACCEPTABLE | NONE), target_group, block_export (bool)
•	decision_policy: auto_redline_if_unacceptable (bool), anchor_conf_threshold, escalate_if_ambiguous (bool), block_export_if_escalated (bool)
•	models: paranoid, valuator, sanitizer (identificadores lógicos)
•	anchors: expresiones y patrones que actúan como “anclas semánticas” para el Paranoico/Validador
•	definitions_scope: términos definidos y cross-refs relevantes para GraphRAG
Ejemplo de plantilla mínima:
{
  "rule_id": "PB:v2026-01:RuleName",
  "clause_family": "IndemnityProdCo",
  "required": true,
  "standard_position": ["<texto canónico 1>", "<texto canónico 2>"],
  "acceptable_variations": ["<fallback 1>", "<fallback 2>"],
  "unacceptable_variations": ["<patrón prohibido 1>", "<patrón prohibido 2>"],
  "guidance_internal": "Notas internas.",
  "analysis_mode": "MODE_ENUMERATED_DEVIATIONS",
  "retrieval_profile": { "vector_top_k": 3, "coverage_threshold": 0.78, "examples_top_k": 6 },
  "routing_policy": { "type": "ESCALATE_IF_UNACCEPTABLE", "target_group": "AmazonLegal", "block_export": true },
  "decision_policy": { "auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true },
  "models": { "paranoid": "openai-fast", "valuator": "openai-best", "sanitizer": "openai-fast" },
  "anchors": ["incumplimiento material no subsanado", "a opción de Amazon", "reclamaciones de terceros"],
  "definitions_scope": { "defined_terms": ["Losses", "Affiliate"], "cross_refs": ["Section X (Definitions)"] }
}
Reglas de configuración por familia
PaymentCredits
Objetivo: asegurar que pagos/entitlements están condicionados a “incumplimiento material no subsanado” y “sujeto a otros términos”.
•	required: true
•	analysis_mode: MODE_ENUMERATED_DEVIATIONS
•	routing_policy: ESCALATE_IF_UNACCEPTABLE; block_export: true
•	decision_policy: auto_redline_if_unacceptable: true; anchor_conf_threshold: 0.85
•	anchors recomendadas: “incumplimiento material no subsanado”, “sujeto a otros términos”, “Exhibit A”
Ejemplo:
{
  "rule_id": "PB:v2026-01:Fees-Core",
  "clause_family": "PaymentCredits",
  "required": true,
  "standard_position": ["Pagos sujetos a Exhibit A y a la ausencia de incumplimiento material no subsanado..."],
  "acceptable_variations": ["Factura electrónica como requisito de proceso, sin alterar condicionantes..."],
  "unacceptable_variations": ["Pagos incondicionales tras PO", "Eliminar 'sujeto a otros términos'"],
  "analysis_mode": "MODE_ENUMERATED_DEVIATIONS",
  "retrieval_profile": { "vector_top_k": 3, "coverage_threshold": 0.8, "examples_top_k": 6 },
  "routing_policy": { "type": "ESCALATE_IF_UNACCEPTABLE", "target_group": "AmazonLegal", "block_export": true },
  "decision_policy": { "auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true },
  "anchors": ["incumplimiento material no subsanado", "sujeto a otros términos", "Exhibit A"]
}
ThirdPartyCredits
Objetivo: mantener “esfuerzos razonables” y privity; impedir garantías/policía frente a terceros.
•	required: true
•	analysis_mode: MODE_ENUMERATED_DEVIATIONS
•	routing_policy: ESCALATE_IF_UNACCEPTABLE; block_export: true
•	Nota: la variante “contractually bind” a terceros en privity suele requerir aprobación; marca guidance y routing para ESCALATE_IF_CHANGE si se detecta.
Ejemplo:
{
  "rule_id": "PB:v2026-01:ThirdPartyCredits-Core",
  "clause_family": "ThirdPartyCredits",
  "required": true,
  "standard_position": ["Amazon usará esfuerzos razonables para informar a terceros con privity..."],
  "acceptable_variations": ["Obligar contractualmente a terceros con privity respecto a créditos, sin deber de policía (con aprobación)"],
  "unacceptable_variations": ["Garantía de cumplimiento por cualquier tercero", "Obligación de policía/auditoría universal"],
  "analysis_mode": "MODE_ENUMERATED_DEVIATIONS",
  "routing_policy": { "type": "ESCALATE_IF_CHANGE", "target_group": "AmazonLegal", "block_export": true },
  "decision_policy": { "auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true },
  "anchors": ["esfuerzos razonables", "privity", "no responsable por terceros"]
}
RepsProdCo
Objetivo: no infracción/ausencia de gravámenes, cumplimiento legal y políticas; sin calificadores de conocimiento.
•	required: true
•	analysis_mode: MODE_STRICT_NO_DEVIATIONS en no infracción/gravámenes; MODE_ENUMERATED_DEVIATIONS en “cumplimiento legal/políticas”
•	routing_policy: ESCALATE_IF_UNACCEPTABLE; block_export: true
Ejemplo (núcleo no infracción):
{
  "rule_id": "PB:v2026-01:RepsProdCo-NonInfringement",
  "clause_family": "RepsProdCo",
  "required": true,
  "standard_position": ["Programa y Materiales no infringen derechos, no vulneran privacidad, libres de cargas..."],
  "acceptable_variations": [],
  "unacceptable_variations": ["A su leal saber y entender...", "Exclusión de 'gravámenes'"],
  "analysis_mode": "MODE_STRICT_NO_DEVIATIONS",
  "routing_policy": { "type": "ESCALATE_IF_UNACCEPTABLE", "target_group": "AmazonLegal", "block_export": true },
  "decision_policy": { "auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.88, "escalate_if_ambiguous": true, "block_export_if_escalated": true },
  "anchors": ["no infringen", "libres de cargas", "privacidad"]
}
Ejemplo (cumplimiento legal/políticas):
{
  "rule_id": "PB:v2026-01:RepsProdCo-Compliance",
  "clause_family": "RepsProdCo",
  "required": true,
  "standard_position": ["Cumplirá con leyes aplicables incl. sanciones, export/reexport, anti-boicot..."],
  "acceptable_variations": ["Eliminar menciones no aplicables con aprobación", "Compromiso de medidas para asegurar cumplimiento (mutua acotada)"],
  "unacceptable_variations": ["Limitar cumplimiento a normas locales laborales", "Subordinar no infracción a póliza E&O"],
  "analysis_mode": "MODE_ENUMERATED_DEVIATIONS",
  "routing_policy": { "type": "ESCALATE_IF_CHANGE", "target_group": "AmazonLegal", "block_export": true },
  "decision_policy": { "auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true },
  "anchors": ["cumplirá con leyes aplicables", "políticas de Amazon", "Development Kickoff Packet"]
}
RepsAmazon
Objetivo: capacidad para contratar; evitar garantías de contenido/resultado.
•	required: false
•	analysis_mode: MODE_STRICT_NO_DEVIATIONS para “capacidad”; MODE_ENUMERATED_DEVIATIONS si se contempla mutua acotada de cumplimiento (con aprobación)
•	routing_policy: ESCALATE_IF_CHANGE
Ejemplo:
{
  "rule_id": "PB:v2026-01:RepsAmazon-Capacity",
  "clause_family": "RepsAmazon",
  "required": false,
  "standard_position": ["Amazon declara y garantiza que tiene pleno derecho y facultad para celebrar y ejecutar el Acuerdo."],
  "acceptable_variations": ["Mutua acotada a 'medidas para asegurar cumplimiento' (con aprobación)"],
  "unacceptable_variations": ["Garantía de no infracción del Programa por Amazon", "Garantías de resultado/explotación"],
  "analysis_mode": "MODE_STRICT_NO_DEVIATIONS",
  "routing_policy": { "type": "ESCALATE_IF_CHANGE", "target_group": "AmazonLegal", "block_export": false },
  "decision_policy": { "auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": false },
  "anchors": ["pleno derecho y facultad", "sin garantías adicionales"]
}
RepsTruthTerm
Objetivo: bring-down/actualizaciones durante la vigencia.
•	required: false
•	analysis_mode: MODE_ENUMERATED_DEVIATIONS
•	routing_policy: ESCALATE_IF_CHANGE
Ejemplo:
{
  "rule_id": "PB:v2026-01:Reps-TruthDuringTerm",
  "clause_family": "RepsTruthTerm",
  "required": false,
  "standard_position": ["Las representaciones son verdaderas a la fecha y se actualizarán si se vuelven inexactas en aspectos materiales..."],
  "acceptable_variations": ["Plazo razonable de notificación", "Limitación a cambios materiales"],
  "unacceptable_variations": ["Renuncia a actualizar", "Traslado de obligación a Amazon"],
  "analysis_mode": "MODE_ENUMERATED_DEVIATIONS",
  "routing_policy": { "type": "ESCALATE_IF_CHANGE", "target_group": "PolicyOwner", "block_export": false },
  "decision_policy": { "auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.83, "escalate_if_ambiguous": true, "block_export_if_escalated": false },
  "anchors": ["verdaderas", "actualización", "material"]
}
IndemnityProdCo
Objetivo: deber de indemnizar y defender; control de defensa por Amazon; cobertura de PI, difamación, privacidad, negligencia/dolo.
•	required: true
•	analysis_mode: MODE_ENUMERATED_DEVIATIONS
•	routing_policy: ESCALATE_IF_UNACCEPTABLE; block_export: true
Ejemplo:
{
  "rule_id": "PB:v2026-01:Indemnity-ProdCo-Core",
  "clause_family": "IndemnityProdCo",
  "required": true,
  "standard_position": ["ProdCo indemnizará, defenderá (a opción de Amazon) y mantendrá indemne a Amazon y Afiliadas..."],
  "acceptable_variations": ["Notificación escrita; demora solo libera si perjuicio material", "Participación de ProdCo a su costo", "Approval no irrazonable de settlements que impongan obligaciones a ProdCo"],
  "unacceptable_variations": ["Eliminar 'defender'", "Co-control de defensa", "Exclusión de PI/difamación/privacidad"],
  "analysis_mode": "MODE_ENUMERATED_DEVIATIONS",
  "routing_policy": { "type": "ESCALATE_IF_UNACCEPTABLE", "target_group": "AmazonLegal", "block_export": true },
  "decision_policy": { "auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.86, "escalate_if_ambiguous": true, "block_export_if_escalated": true },
  "anchors": ["defender (a opción de Amazon)", "reclamaciones de terceros", "costos y gastos razonables"],
  "definitions_scope": { "defined_terms": ["Losses"], "cross_refs": ["Definiciones"] }
}
IndemnityAmazon
Objetivo: cobertura por distribución/marketing/publicidad/ancillary; no extender a “successors/assignees” de ProdCo.
•	required: true
•	analysis_mode: MODE_ENUMERATED_DEVIATIONS
•	routing_policy: ESCALATE_IF_CHANGE; block_export: true
Ejemplo:
{
  "rule_id": "PB:v2026-01:Indemnity-Amazon-Core",
  "clause_family": "IndemnityAmazon",
  "required": true,
  "standard_position": ["Amazon indemnizará y defenderá a ProdCo por reclamaciones de terceros derivadas de distribución, marketing, publicidad y explotación..."],
  "acceptable_variations": ["Añadir directores/empleados de ProdCo (no 'cesionarios/sucesores')", "Procedimiento de notificación alineado"],
  "unacceptable_variations": ["Extender a 'successors/assignees' de ProdCo", "Cobertura por actos de terceros sin privity", "Defensa por counsel elegido por ProdCo"],
  "analysis_mode": "MODE_ENUMERATED_DEVIATIONS",
  "routing_policy": { "type": "ESCALATE_IF_CHANGE", "target_group": "AmazonLegal", "block_export": true },
  "decision_policy": { "auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true },
  "anchors": ["distribución", "marketing", "publicidad", "derechos accesorios"]
}
DefenseSettlement
Objetivo: control de defensa y settlement por Amazon; notificación; participación de ProdCo sin veto general.
•	required: true
•	analysis_mode: MODE_ENUMERATED_DEVIATIONS
•	routing_policy: ESCALATE_IF_UNACCEPTABLE; block_export: true
Ejemplo:
{
  "rule_id": "PB:v2026-01:Defense-Settlement-Core",
  "clause_family": "DefenseSettlement",
  "required": true,
  "standard_position": ["Amazon tendrá la opción de controlar la defensa y el settlement; la demora en notificación solo libera si hay perjuicio material..."],
  "acceptable_variations": ["Consentimiento de ProdCo para acuerdos que le impongan obligaciones (no irrazonable)"],
  "unacceptable_variations": ["Co-control de defensa por defecto", "Veto general de ProdCo sobre settlement", "Liberación automática por retraso sin perjuicio"],
  "analysis_mode": "MODE_ENUMERATED_DEVIATIONS",
  "routing_policy": { "type": "ESCALATE_IF_UNACCEPTABLE", "target_group": "AmazonLegal", "block_export": true },
  "decision_policy": { "auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.87, "escalate_if_ambiguous": true, "block_export_if_escalated": true },
  "anchors": ["control de la defensa", "perjuicio material", "participación a costo de ProdCo"]
}
SurvivalRemedies
Objetivo: supervivencia de indemnidades/limitaciones; coherencia entre definiciones y exclusiones.
•	required: true
•	analysis_mode: MODE_POLICY_JUDGMENT_REQUIRED (suele requerir criterio en alcance/consistencia)
•	routing_policy: ESCALATE
Ejemplo:
{
  "rule_id": "PB:v2026-01:Survival-Remedies-Core",
  "clause_family": "SurvivalRemedies",
  "required": true,
  "standard_position": ["Las obligaciones de indemnización, confidencialidad y limitación de responsabilidad sobreviven..."],
  "acceptable_variations": ["Listado ejemplificativo de secciones que sobreviven, siempre que incluya indemnidades y confidencialidad"],
  "unacceptable_variations": ["No supervivencia de indemnidades", "Límites que erosionan cobertura pactada"],
  "analysis_mode": "MODE_POLICY_JUDGMENT_REQUIRED",
  "routing_policy": { "type": "ESCALATE", "target_group": "SeniorCounsel", "block_export": true },
  "decision_policy": { "auto_redline_if_unacceptable": false, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true },
  "anchors": ["sobreviven", "indemnización", "confidencialidad"]
}
Recomendaciones de operación y versionado
•	Versionado estricto: rule_id debe incluir versión del playbook. Toda respuesta de agentes persiste con ese rule_id:version.
•	Derivación automática: analysis_mode y routing_policy pueden autocompletarse desde banderas del playbook (p. ej., “No deviations allowed” → MODE_STRICT_NO_DEVIATIONS).
•	Thresholds por familia:
o	anchor_conf_threshold: 0.85–0.88 en familias críticas (Indemnities, DefenseSettlement, RepsProdCo-NI).
o	coverage_threshold (router): 0.78–0.82 según densidad de vocabulario.
•	Block export:
o	true para familias núcleo (Fees, ThirdPartyCredits, Indemnities, DefenseSettlement, SurvivalRemedies).
o	false para RepsAmazon/RepsTruthTerm (a criterio de negocio).
•	VariationSet: por rule_id, mantén STANDARD/ACCEPTABLE/UNACCEPTABLE/NOT_COVERED con 10–20 ejemplos cada uno para robustez del Paranoico.
Checklist de calidad al cargar un PolicySpec
•	¿El standard_position contiene el texto exacto y versionado? Sí/No.
•	¿Los acceptable/unacceptable son exhaustivos y alineados con el playbook? Sí/No.
•	¿analysis_mode refleja la naturaleza de la regla (estricto, enumerado o juicio)? Sí/No.
•	¿routing_policy y decision_policy bloquean exportación donde corresponde? Sí/No.
•	¿anchors cubren las expresiones clave que activan los detectores? Sí/No.
•	¿definitions_scope lista términos y cross-refs críticos para GraphRAG? Sí/No.
Con esta configuración, cada familia de cláusulas queda “operacionalizada” para tu pipeline: el Router enruta con confianza, el Paranoico detecta diferencias con spans reproducibles, el Valorador decide sin inventar texto y el Decisor gobierna el riesgo con reglas deterministas y bloqueos de exportación donde corresponda.
CopyExportRewriteOpen in editor
Rate the response
Follow-ups
¿Permite la estructura base de PolicySpec la inclusión de campos adicionales específicos para cada familia de cláusulas?
¿Refleja el analysis_mode de cada familia la naturaleza de las desviaciones permitidas según los ejemplos proporcionados?
¿Bloquea la routing_policy la exportación en todas las familias núcleo mencionadas en las recomendaciones de operación y versionado?
¿Incluye el checklist de calidad criterios para verificar la exhaustividad de los ejemplos en el VariationSet por rule_id?
Necesito que me ayudes a construir un playbook de revisión para este tipo de acuerdos, enfocado en Amazon. 1\.     Por favor, estructura las cláusulas contenidas en los acuerdos en categorías claras y definidas, con el objetivo de generar un dataset que se describa en una tabla. En esta tabla: ·      Las filas deben representar la tipología de cláusulas. ·      Las columnas deben ser tres: "Aceptables", "Pasables" y "No aceptables". 1\.     Para cada celda de esta matriz (es decir, para cada combinación de tipo de cláusula y nivel de aceptación), desarrolla 20 ejemplos basados en los documentos adjuntos. Estos ejemplos deben servir para valorar y contrastar cualquier contrato de este tipo desde la óptica de Amazon. 2\.     El playbook debe ser detallado y práctico, orientado a facilitar la revisión y evaluación de contratos similares en el futuro. Por favor, entrega el resultado en un formato claro y organizado, preferiblemente con la tabla y los ejemplos bien diferenciados. El objetivo de cada grupo de ejemplos es nutrir un sistema rag de analisis y revisión de este contrato. Por favor no dividas el trabajo en lotes, configura la relación de contratos y procede a la generación de la tabla de clausulas de manera íntegra.
¿Qué criterios se utilizan para clasificar una cláusula como 'Pasable' en la matriz?
¿Cómo se define una cláusula 'Pasable' en comparación con una 'Aceptable'?
¿Qué se debe hacer con los textos que comprometan las anclas de riesgo de Amazon?
¿Cuándo es necesario escalar un caso a Amazon Legal?
que arquitectura multiagente especialista sugieres para el contrato? cuantos agentes especialistas en cada bloque o cláusula concreta. Este es el flujo que se estaba considerando A continuación propongo una **estrategia concreta de configuración** del **flujo multiagéntico** “clause-by-clause” **basada estrictamente en el Playbook**, pensada para orquestarse en **n8n**, persistir en **Supabase (Postgres + vector)**, y operar con **frontend Lovable** con separación dura **Internal vs Client-facing**. --- ## 1) Premisas de configuración 1. **El Playbook manda**: cada decisión del sistema debe ser trazable a **(Rule Name + versión)** y a evidencia textual (span/anchor). Si falta cobertura → **Not covered by playbook** y **escalado**. 2. **Multiagente ≠ multiopinión**: los agentes no “negocian”; ejecutan un pipeline de: * **detección exhaustiva** (alto recall), * **valuación conforme al Playbook** (alto precision), * **decisión determinista** (gating y escalado), * **sanitización obligatoria** (anti-internalization). 1. **Separación dura** (clave para tu constraint): * **Internal**: razonamiento completo, referencias a reglas, guidance, thresholds, “por qué” real. * **Client-facing**: solo *“qué cambio proponemos”* + comentario neutral. Sin Rule Name, sin guidance, sin rangos, sin “aceptable/inaceptable”, sin pistas. --- ## 2) Compilación del Playbook a “config ejecutable” (Playbook → PolicySpec) Antes de hablar de agentes, el primer paso es convertir el Excel/JSON a una estructura estable y operable por máquina (esto es el “source-of-truth compiler”). ### 2.1. Normalización por regla (PolicySpec) Por cada fila del Playbook, crear un `PolicySpec` con: * `rule_id` (estable): `PlaybookId:Version:RuleName` * `required` (Yes/No) * `standard_position_ref`: puntero a texto estándar (no copiar a prompts client) * `acceptable_deviations_ref` * `unacceptable_deviations_ref` * `guidance_ref` (solo interno) * `clause_family` (taxonomía interna; ver §3) * **derivados computables** (sin inventar reglas): * `analysis_mode` (ver §2.2) * `routing_policy` (ver §2.3) * `retrieval_profile` (vector topK, umbrales) * `redline_strategy` (safe actions permitidas) ### 2.2. Clasificación de “modo de análisis” (sin inventar reglas) Sin rellenar huecos, solo categorizas la regla según lo que *ya dice* el Playbook: * **MODE_STRICT_NO_DEVIATIONS** Cuando `Acceptable Deviations = None` o `Unacceptable Deviations = Any change/Any change to section`. → Cualquier divergencia relevante dispara hallazgo. * **MODE_ENUMERATED_DEVIATIONS** Cuando el Playbook enumera desviaciones aceptables/inaceptables (listas/patrones concretos). → Detector por evidencias textuales + (si quieres) soporte semántico *solo para encontrar la instancia*, no para ampliar la política. * **MODE_POLICY_JUDGMENT_REQUIRED** Cuando el Playbook usa formulaciones del tipo “reduce el alcance de forma material” o “expande obligaciones más allá de política”. → Aquí el agente **no decide “materialidad” como hecho** si no puede justificarlo desde el Playbook: produce **hipótesis** + evidencia y, si hay duda, **escalado**. ### 2.3. Compilación del Guidance a RoutingPolicy (sin exponerlo) Transforma el `Guidance` a una estructura interna: * `routing_policy.type` ∈ {`AUTO_ACCEPT`, `ESCALATE`, `ESCALATE_IF_CHANGE`, `ESCALATE_IF_UNACCEPTABLE`, `NONE`} * `routing_policy.target_group` (interno): p.ej. “PolicyOwner”, “SeniorCounsel”, “AmazonLegal” (pero **nunca** aparece en client UI) * `routing_policy.block_export` (bool): si bloquea exportación client pack mientras no haya aprobación interna Esta compilación se puede hacer con heurística simple (string match) + override manual desde consola (editor visual). --- ## 3) Taxonomía de agentes especialistas “por familia” (16 reglas → 7–9 perfiles) Aunque pedís “un agente especialista por cláusula”, para mantener **operabilidad y coste**, mi recomendación es: * **Perfiles de agente por familia jurídica** (p. ej. IndemnityAmazon), * **parametrizados por PolicySpec** (RuleName + texto relevante + ejemplos), * y en runtime se instancian “virtualmente” por regla. Esto te da especialización sin multiplicar prompts/código. ### 3.1. Propuesta de perfiles (basado en tus 16 reglas) * **Agent.PaymentCredits**: Fees, Entitlements/Credit * **Agent.ThirdPartyCredits**: Third-Party Credit Obligations * **Agent.RepsProdCo**: Reps ProdCo 1/2/3 * **Agent.RepsAmazon**: Reps Amazon 1/2 * **Agent.RepsTruthTerm**: Representations/Warranties (true during Term) * **Agent.IndemnityProdCo**: Indemnity by ProdCo * **Agent.IndemnityAmazon**: Indemnity Amazon 1/2/3/4 * **Agent.SurvivalRemedies**: Survival + limitations/exclusions (Indemnity 1 & 3) > Si querés “1 agente = 1 regla” por marketing/claridad, lo representás así en UI, pero técnicamente conviene “perfil + PolicySpec”. --- ## 4) Flujo multiagéntico por cláusula (Paranoico → Valorador → Decisor), con RAG/GraphRAG ### 4.1. Arquitectura del subworkflow n8n “ClauseReview” Por cada `ClauseInstance`, ejecutás: **(0) Clause Router (determinista + embeddings)** * Input: texto de cláusula + metadatos (heading, número, contexto) * Acción: * `topK_rules = vector_search(StandardPosition)` en Supabase/pgvector * Heurísticas de soporte (keywords, headings) para desambiguar * Output: * `candidate_rules[]` con scores * `coverage_confidence` * Si `coverage_confidence < threshold` → `NotCovered` (pasa a Decider) --- **(1) Context Retriever (RAG “gobernado”)** * Recupera desde Supabase: * `PolicySpec` de la regla top (y quizá top2 para fallback) * `VariationSet` (ejemplos aceptables/inaceptables/estándar) **solo de esa regla** * (Opcional) `GraphRAGContext` (ver 4.3) *Regla clave*: el Retrieval solo trae **lo necesario**, evitando exponer playbook completo al modelo. --- **(2) Agente “Analista Paranoico” (alto recall)** * Objetivo: **encontrar TODO** lo que potencialmente sea una desviación (sin decidir). * Config: * Modelo: más económico/rápido si querés optimizar; temperatura 0 * Output JSON estricto (schema) * Input: * Clause text * Standard Position (o resumen interno) * Acceptable/Unacceptable (solo lo de esa regla) * Ejemplos del VariationSet (few-shot) * Output (solo interno): * `observations[]` con: * evidencia (quote + offsets) * tipo (missing/added/modified) * “posible categoría” ∈ {`MatchesStandard`, `MatchesAcceptable`, `MatchesUnacceptable`, `UnknownChange`} * `confidence` **Regla de oro**: el Paranoico puede “ver fantasmas”; está permitido. No propone texto final. --- **(3) Agente “Valorador Conforme al Conjunto” (alto precision)** * Objetivo: convertir observaciones en: * (a) **clasificación final** respecto al Playbook, * (b) **propuesta de acción** (ChangeSet), * (c) **requisitos de escalado**. * Input: * lo mismo que Paranoico + * observaciones producidas por Paranoico + * (si activás GraphRAG) contexto relacionado (definiciones, cross-refs) * Output JSON estricto: * `final_status` ∈ {`Compliant`, `AcceptableDeviation`, `UnacceptableDeviation`, `NotCoveredByPlaybook`, `Ambiguous`} * `proposed_changes[]` (sin inventar texto): * insert/replace/delete * anchor candidate(s) * `internal_justification` (referencia a `rule_id`, versión) * `escalation_recommended` + `escalation_reason` (interno) * `confidence_overall` **Reglas duras del Valorador**: * Si algo no encaja explícitamente en Acceptable/Unacceptable y la regla no permite juicio → `NotCoveredByPlaybook` o `Ambiguous` (no “decide”). * El texto propuesto para insertar/reemplazar **solo puede provenir del Standard Position** (o fallback textual explícito si el Playbook lo incluye). Si no, debe pedir escalado. --- **(4) Validador Determinista (no LLM)** Implementado como nodo Code en n8n (JS/TS) o Supabase Edge Function: Valida: * **Playbook adherence**: * si `final_status` = AcceptableDeviation, debe existir evidencia de match con Acceptable Deviations. * si `final_status` = UnacceptableDeviation, debe existir evidencia concreta o regla strict. * **No “texto nuevo”**: * cualquier `insertText` / `replaceText` debe estar 100% contenido en `Standard Position` (match exacto/normalizado), salvo que el Playbook provea fallback explícito. * **Anchor confidence**: * calcula `anchor_confidence` (hash contexto, offsets, fallback similitud) * si < umbral → marca `needs_human_validation = true` * **Leak-precheck** (aunque aún es interno): * comprueba que `client_comment_candidate` (si existiera) no contenga términos prohibidos. --- **(5) Agente/Componente “Decisor” (gating determinista)** Esto no debería ser un LLM: debe ser **una matriz determinista** basada en campos del Playbook y scores. Entradas: * `required` de la regla * `routing_policy` * `final_status` * `confidence_overall` * `anchor_confidence` * `analysis_mode` Salidas: * `decision` ∈ {`AUTO_PASS`, `AUTO_REDLINEDRAFT`, `ESCALATE_HUMAN`, `BLOCK_EXPORT`, `LOG_ONLY`} * `escalation_queue` (si aplica) **Matriz recomendada (resumen)**: * Si `final_status ∈ {NotCoveredByPlaybook, Ambiguous}` → `ESCALATE_HUMAN` * Si `final_status = UnacceptableDeviation`: * si `anchor_confidence >= threshold` → `AUTO_REDLINEDRAFT` * si no → `ESCALATE_HUMAN` * además si `routing_policy.type` implica escalado → `ESCALATE_HUMAN` o `BLOCK_EXPORT` * Si `final_status ∈ {Compliant, AcceptableDeviation}`: * `AUTO_PASS` (y si routing dice “auto-accept” queda log interno) Y si `required = No`: * nunca bloquea export, pero puede sugerir redline + escalado “soft” según tu política comercial. --- **(6) Sanitizer (obligatorio, antes de client-facing)** Puede ser determinista (plantillas) o un LLM pequeño con prompt de sanitización estricta. Entrada: `internal_justification`, `rule_id`, `final_status`, `proposed_change` Salida: `client_comment` neutral + `client_summary_line` Reglas: * Prohibido: RuleName, Playbook, guidance, “acceptable/unacceptable”, “según política interna X”, nombres de equipos, rangos, umbrales. * Permitido: explicación neutral del tipo “Alinear con términos estándar / clarificar / evitar ambigüedad / asegurar consistencia”. **Importante**: el Sanitizer no decide; solo redacta. --- ## 4.2. Configuración n8n: cómo montarlo (práctico) **Workflow principal**: `ContractReview` 1. Webhook (Lovable upload) 2. Store file (Supabase Storage) 3. Parse/normalize (Code node / microservicio) 4. Segment clauses (Code node) → genera `ClauseInstances[]` 5. SplitInBatches (por cláusula) → llama subworkflow `ClauseReview` 6. Aggregate results 7. Contract-level checks (ver 4.4) 8. Generate draft redline DOCX (servicio docx) 9. Update Supabase status + notificación a UI **Subworkflow**: `ClauseReview` * Router → Retriever → Paranoid → Valuator → Deterministic Validator → Decider → Sanitizer → Persist **Clave competitiva**: corre cláusulas en paralelo con control de concurrencia (p. ej. 5–10 concurrentes) para latencia “top product”. --- ## 4.3. Dónde encaja GraphRAG (diferencial real, no cosmético) GraphRAG te da ventaja frente a “RAG plano” cuando: * hay **definiciones** que cambian el significado de múltiples cláusulas, * hay **cross-references** (“as defined in Section X”), * hay dependencias entre indemnidad/limitaciones/supervivencia. ### Configuración recomendada: 1. **Construir un “Contract Graph” por documento**: * Nodes: `ClauseInstance`, `DefinedTerm`, `Exhibit`, `CrossReference` * Edges: `defines`, `refers_to`, `modifies`, `depends_on` 2. En `Context Retriever`, además de la regla, recuperas: * definiciones relacionadas a términos clave presentes en la cláusula, * cláusulas referenciadas por cross-ref. 3. El Valorador usa ese contexto **solo para resolver ambigüedades de interpretación y coherencia**, nunca para inventar políticas. **Ejemplo de uso correcto**: * Si una cláusula dice “Losses” y la definición de “Losses” está en otra sección, GraphRAG permite traerla para interpretar si la cláusula se aleja del estándar (sin inventar). --- ## 4.4. Agentes “a nivel contrato” (recomendación para máxima calidad) Además del clause-by-clause, añade dos pasos globales: ### A) Completeness Checker (determinista + RAG) * Verifica que para todas las reglas Required=Yes existan `ClauseInstances` mapeadas. * Si falta una familia: genera hallazgo “missing section” + propuesta de inserción del estándar **si el Playbook lo permite**, si no, escalado. ### B) Consistency Checker (GraphRAG + reglas) * Busca incoherencias obvias: * definiciones no usadas, * referencias cruzadas rotas, * duplicidades de secciones. * No decide política; solo crea banderas para revisión o corrección estructural. --- ## 5) Configuración calibrable desde consola (editor visual) Lo que el despacho debe poder ajustar **sin tocar código**, pero sin romper el Playbook: ### 5.1. “Knobs” por regla (PolicySpec UI) * `Coverage threshold` (para Router) * `TopK retrieval` * `Strictness mode` (derivado, pero editable solo para “más conservador”, no para relajar lo prohibido) * `Auto-redline allowed` (on/off) * `Anchor confidence threshold` * `Escalation rules` (derivadas de guidance; editable) * `Business-mode threshold` vs `Legal-mode threshold` (si aplicás perfiles por usuario) ### 5.2. “Knobs” globales * Concurrencia por contrato * Modelo OpenAI por etapa (Paranoico vs Valorador vs Sanitizer) * Plantillas de comentarios client-facing (biblioteca aprobada) * Lista de términos prohibidos (Leak Guard) * Política de bloqueo de exportación si hay escalados sin resolver **Regla innegociable**: el cliente nunca ve esta consola; es rol despacho. --- ## 6) Repositorio de variaciones + datos sintéticos (sin “inventar” política) Tu repositorio de variaciones es clave para que el agente sea “especialista” sin fine-tuning al inicio. ### 6.1. Estructura del VariationSet Por `rule_id`, guardar ejemplos etiquetados: * `STANDARD` * `ACCEPTABLE` * `UNACCEPTABLE` * `NOT_COVERED` (importante para que el sistema aprenda a escalar) Cada ejemplo: * texto * etiqueta * metadatos (qué cambio se aplicó, si fue synthetic o real) * embedding (pgvector) ### 6.2. Generación sintética “segura” (policy-safe) El generador sintético (n8n job) debe cumplir: * Para `ACCEPTABLE`: aplicar **solo** desviaciones descritas como aceptables. * Para `UNACCEPTABLE`: aplicar **solo** desviaciones descritas como inaceptables (sin ampliar con sinónimos “creativos”). * Para `NOT_COVERED`: cambios plausibles **no descritos** en el Playbook, para entrenar el comportamiento de escalado (esto NO añade reglas; solo ejemplos de “no sé → escalo”). ### 6.3. Bucle de actualización * Cada contrato revisado + decisiones humanas (cuando se escale) alimenta: * nuevos ejemplos reales para VariationSet, * métricas por regla (precision/recall), * ajuste de umbrales desde consola. --- ## 7) Qué hace “top y diferencial” este flujo 1. **Especialización real** (por familia/rule) con VariationSet + RAG gobernado. 2. **Multiagente con roles no redundantes**: Paranoico detecta, Valorador decide conforme al Playbook, Decisor gobierna el riesgo. 3. **Gating determinista** (no LLM) para decisiones de escalado: auditable, defendible. 4. **GraphRAG para coherencia contractual**: diferencial frente a “Copilot-like” que mira texto plano. 5. **Anti-internalization by design**: Sanitizer obligatorio + leak guard + separación de campos/DB. --- ## 8) Snippet mínimo de configuración (ejemplo, sin revelar texto del Playbook) ``` { "rule_id": "DSA_Amazon:v2025-10-29:Indemnity by Amazon 3", "clause_family": "IndemnityAmazon", "required": true, "analysis_mode": "MODE_POLICY_JUDGMENT_REQUIRED", "retrieval_profile": { "vector_top_k": 3, "coverage_threshold": 0.78, "examples_top_k": 6 }, "decision_policy": { "auto_redline_if_unacceptable": true, "anchor_conf_threshold": 0.85, "escalate_if_ambiguous": true, "block_export_if_escalated": true }, "models": { "paranoid": "openai-fast", "valuator": "openai-best", "sanitizer": "openai-fast" }, "client_comment_template_id": "ALIGN_TO_STANDARD_NEUTRAL" } ``` --- ### Cierre: recomendación operativa Si querés salir “a competir” con un producto top desde el día 1, mi recomendación es: * **Implementar el flujo completo** (Router → Paranoico → Valorador → Validador → Decisor → Sanitizer) desde MVP, aunque al inicio GraphRAG sea “light”. * Empezar con **RAG + VariationSet** como “entrenamiento” (sin fine-tuning), y usar **datos sintéticos seguros** para robustez. * Meter GraphRAG como diferencial en V1 (rápido): mínimo viable = definiciones + cross-refs. Si querés, en el siguiente paso puedo devolverte: * un **diseño de prompts (system + developer prompts)** por perfil de agente, * el **JSON Schema** de outputs para Paranoico/Valorador/Sanitizer, * y una **matriz de decisión completa** (tabla) que ya contemple Required Yes/No, confianza, y routing. *
detalla los JSON Schemas de outputs para Paranoico/Valorador/Sanitizer y una matriz de decisión determinista que conecte required/routing\_
¿Cómo se asegura el Agente Analista Paranoico de maximizar la cobertura con evidencia y offsets reproducibles? ¿Qué tipos de acciones puede proponer el Agente Valorador Conforme al Playbook en los cambios sugeridos? ¿Qué medidas toma el Agente Sanitizer para evitar la exposición de reglas internas y nombres de equipos? ¿Cómo maneja el Decisor/Gating los casos en los que el final_status es 'UnacceptableDeviation' y el anchor_confidence es menor que TH_ANCHOR? ¿Cómo maneja el Decisor/Gating los casos en los que el final_status es 'UnacceptableDeviation' y el anchor_confidence es menor que TH_ANCHOR? Finished in 2 steps Cuando el Decisor recibe un final_status = “UnacceptableDeviation” con un anchor_confidence por debajo de TH_ANCHOR, aplica una regla determinista de prudencia: no procede a redline automático y remite el caso a revisión humana. A continuación detallo la lógica exacta y los efectos colaterales a nivel de contrato. ## **Regla determinista aplicable** * Acción primaria: **ESCALATE_HUMAN**. Un ancla débil implica que no hay ubicación/empalme suficientemente confiable para aplicar un cambio automático, aunque la desviación sea inaceptable por política. * Redline automático: **no permitido**. Se desactiva cualquier intento de AUTO_REDLINEDRAFT porque la baja confianza de anclaje compromete la precisión de la enmienda. * Registro: el Decisor conserva el estado “UnacceptableDeviation” y etiqueta la causa como **LOW_CONFIDENCE_ANCHOR** en el campo de escalamiento, para auditoría. ## **Interacción con routing_policy y required** * routing_policy.type = AUTO_ACCEPT / NONE: se mantiene **ESCALATE_HUMAN** por la ancla débil. * routing_policy.type = ESCALATE o ESCALATE_IF_UNACCEPTABLE: también resulta en **ESCALATE_HUMAN** (coincide con la regla base, por lo que no hay excepción). * required = true y routing_policy.block_export = true: además de **ESCALATE_HUMAN**, el Decisor emite una marca de **BLOCK_EXPORT** a nivel de contrato hasta que se resuelva el escalado. * required = false: no se bloquea la exportación del paquete contractual, pero se mantiene el flag de escalamiento interno. ## **Señales operativas para el panel interno** * Etiqueta de causa: **LOW_CONFIDENCE_ANCHOR**. * Recomendaciones internas adjuntas: * **Re anchor**: sugerencia de regenerar ancla elevando topK de recuperación o relajando la ventana de contexto para el Validador/Paranoico. * **Human pin point**: pedir al revisor que seleccione manualmente el span correcto o confirme la posición del reemplazo. * **Cross ref check**: si hay definiciones/cross refs, activar el retriever GraphRAG ligth para mejorar el anclaje. ## **Umbrales y efectos secundarios** * TH_ANCHOR es el umbral configurable (p. ej., 0.85 por defecto). Por debajo de este valor, el Decisor no autoriza redlines automáticos en ningún caso de “UnacceptableDeviation”. * Si además confidence_overall < TH_CONF_OVERALL, el Decisor puede añadir el motivo secundario **LOW_CONFIDENCE_OVERALL** al registro de escalamiento; la acción sigue siendo **ESCALATE_HUMAN**. ## **Pseudocódigo específico del caso** * if final_status == "UnacceptableDeviation" and anchor_confidence < TH_ANCHOR: * decision = "ESCALATE_HUMAN" * escalation_reason = "LOW_CONFIDENCE_ANCHOR" * if rule.required and routing.block_export: * contract_level_flag = "BLOCK_EXPORT" ## **Qué NO hace el Decisor en este caso** * No re clasifica la cláusula como “Ambiguous” o “NotCoveredByPlaybook”: mantiene “UnacceptableDeviation” como evaluación de fondo. * No intenta normalizar el texto propuesto ni “inventar” un ancla alternativa: delega en revisión humana o en un re anclaje explícito gestionado por el flujo técnico. En síntesis, una desviación inaceptable con ancla de baja confianza siempre se escala a revisión humana; si además la regla es requerida y el enrutado bloquea exportación, el contrato queda bloqueado hasta resolver el caso. Esto preserva precisión, auditabilidad y control de riesgo. **Rate the response** **Follow-ups** Explica cómo afecta la presencia de required = true y routing_policy.block_export = true al flujo de escalamiento y exportación del contrato. Describe qué recomendaciones internas se generan para el panel cuando la causa de escalamiento es LOW_CONFIDENCE_ANCHOR. Evalúa por qué el Decisor no permite redline automático cuando anchor_confidence está por debajo de TH_ANCHOR, incluso si la desviación es inaceptable. Detalla qué acciones adicionales toma el Decisor si confidence_overall también está por debajo de TH_CONF_OVERALL.
Necesito los prompts para cada uno de los agentes
**Follow-ups** ¿Incluye el Agente 0 alguna lógica para manejar casos en los que no se detecten reglas candidatas? ¿Cómo determina el Agente 1 la categoría tentativa de cada hallazgo? ¿Qué acciones toma el Agente 2 si el analysis_mode es MODE_STRICT_NO_DEVIATIONS y se detecta un cambio relevante? ¿Qué sucede si el Agente 3 detecta términos bloqueados en el client_comment o client_summary_line?
Cuantas rutas agente paranoico-Valorador hacen faltas según grupos de cláusulas?
¿Cómo se configura el PolicySpec para cada familia de cláusulas?
Rate this response

Ask Harvey



 
References
1.	PSA FALLBACKS AS OF OCTOBER 20, 2025 Page 1 of 10 "PROGRAM" SERVICES AGREEMENT PRINCIPAL TERMS 1. EFFECTIVE DATE: XXXX 2. PARTIES: Amazon Content Services LLC ("Amazon") PRODCO ("ProdCo") 3. SERVICES: ProdCo will render services as set forth in this agreement, including any exhibits and schedules attached hereto (which are incorporated by reference), which constitute the entire agreement between the parties (collectively, the "Agreement"), for the original scripted television series audio-visual program currently known as "PROGRAM" (together with all elements thereof, the "Program"). 4. RIGHTS1: All rights in the Program, including all materials commissioned (including the results and (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx)
2.	aspects of credits will be at Amazon's sole discretion. Amazon's inadvertent failure to comply with such credit obligations will not constitute a breach of this Agreement, but upon receipt of written notice from ProdCo, Amazon will make commercially reasonable efforts to correct any credit error by Amazon on a prospective basis. [GIVE: Amazon shall use reasonable efforts to inform all third parties with whom Amazon is in contractual privity of the credit obligations set forth herein, but is not responsible or liable to ProdCo for any failure of any third parties to comply with such credit obligations.]8[ALTERNATE GIVE (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 1)
3.	not in breach of this Agreement, subject to any ot The qualifier "uncured, material" may be added before ProdC If there are any qualifiers to the concept of breach, no other NTD: The acceptable deviations ("uncured, material breach") cYes Entitlements; Credit As you are the legal advisor of Amazon, the broader the defin The qualifier "uncured, material" may be added before ProdC If there are any qualifiers to the concept of breach, no other NTD: If any unacceptable qualifiers to the concept of breach a Yes… (PLAYBOOK_DSA_Amazon_20251029_100840 (back up playbooks).xlsx)
4.	credit error by Amazon on a prospective basis. [GIVE: Amazon shall use reasonable efforts to inform all third parties with whom Amazon is in contractual privity of the credit obligations set forth herein, but is not responsible or liable to ProdCo for any failure of any third parties to comply with such credit obligations. ]8[ALTERNATE GIVE (WITH AMAZON LEGAL APPROVAL): Amazon shall contractually bind all third parties with whom Amazon is in contractual privity of the credit obligations set forth herein, but shall have no obligation to police same, nor shall Company be responsible or liable to ProdCo (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 1)
5.	obligations.]8[ALTERNATE GIVE (WITH AMAZON LEGAL APPROVAL): Amazon shall contractually bind all third parties with whom Amazon is in contractual privity of the credit obligations set forth herein, but shall have no obligation to police same, nor shall Company be responsible or liable to ProdCo for the failure of any third party to comply with the same. ]9 7… (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 1)
6.	REPRESENTATIONS/WARRANTIES; INDEMNITY: ProdCo represents, warrants and agrees that: (i) the Program (including all materials previously created for the Program) and Materials are original and qualify for full copyright protection (other than materials supplied to ProdCo by Amazon and/or materials supplied by ProdCo at Amazon's explicit request and/or direction, or any elements in the public domain), will not infringe or violate any intellectual property rights (including any copyright) of, and will not defame, infringe or violate the rights of privacy or any other rights of any person or entity, and are not subject to any claim, encumbrance or third-party (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
7.	substantially all of the assets of 6 Amazon Position: If ProdCo wishes to delete carveout for indemnification obligations and breach of confidentiality from waiver of claims, hold. Since this is a mutual waiver between the parties, cannot remove as a matter of corporate policy. Amazon must be indemnified for these types of damages to the extent applicable and have these damages available for ProdCo's breach of confidentiality (to protect against unauthorized disclosures of upcoming storylines and any other non- public information related to the Program). In discussing with ProdCo (whether via call or through notes), feel free to (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 2)
8.	[GIVE (WITH AMAZON LEGAL APPROVAL): Amazon represents and warrants that it has the full right and power to make and perform this  10 Amazon Position: If ProdCo wishes to add "to the best of ProdCo's knowledge" as a qualifier to representation and warranty that Program and Material will not infringe or violate the rights of any person or entity. We're unable to accommodate ProdCo's request. Amazon recognizes a line item in the budget for E&O insurance funded by Amazon that covers these types of claims regardless of ProdCo's level of negligence or intent, provided there is no (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 2)
9.	right to enter into and perform under this Agreement. Each of Amazon and ProdCo represents, warrants and agrees that such party has measures in place designed to ensure compliance with applicable laws, rules and regulations (including import/re-import, sanctions, anti-boycott, export/re-export control laws and tax evasion and tax evasion facilitation laws). ProdCo will indemnify, defend (at Amazon's option), and hold harmless Amazon and its assignees, licensees, and each of their affiliates against any losses, liability, damages, judgements, cost or expenses ("Losses") arising out of any third-party claim in connection with the development and production by ProdCo of the Program, (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
10.	and tax evasion and tax evasion facilitation laws). ProdCo will indemnify, defend (at Amazon's option), and hold harmless Amazon and its assignees, licensees, and each of their affiliates against any losses, liability, damages, judgements, cost or expenses ("Losses") arising out of any third-party claim in connection with the development and production by ProdCo of the Program, ProdCo's breach of any of its agreements, representations or warranties under this Agreement and/or ProdCo's negligence or willful misconduct.… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
11.	Amazon will indemnify, defend, and hold harmless ProdCo and its affiliates, and successors against any Losses arising out of any third-party claim in connection with the distribution marketing and exploitation of the Program and all ancillary rights therein and thereto by Amazon or its affiliates , other than with respect to any Losses for which ProdCo is required to indemnify Amazon under this Agreement. If either Amazon or Prodco is entitled to defense or indemnification hereunder, the indemnitee will give the indemnifying party prompt written notice of the applicable claim (but any delay in notification will not relieve (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
12.	indemnifying party's ability to defend such claim). Amazon will have the option to control the defense and settlement of any claim. In addition, ProdCo will have the right to participate, at its own expense and with counsel of its own choosing, in the defense of any claim. 8. MISCELLANEOUS (CONDITIONS PRECEDENT, DAMAGES, INJUNCTIVE RELIEF, ASSIGNMENT, ETC… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
13.	defense and settlement of any claim [POSSIBLE GIVE:, but Amazon may not, without the prior written approval of ProdCo (which may not be unreasonably withheld), enter into or acquiesce to any settlement that contains any admission of or stipulation to any guilt, fault, liability or wrongdoing on the part of ProdCo or that imposes any restrictions, obligations, or liabilities on ProdCo ,] and ProdCo will cooperate reasonably with Amazon and provide all information and assistance as Amazon may reasonably require in connection with the defense and settlement of such claim… (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 3)
14.	: Amazon's obligations hereunder are subject to any conditions precedent set forth in Exhibit A. 3 As between ProdCo and Amazon, Amazon has sole and final control over the Program.4 ProdCo will not release or authorize any publicity or marketing relating to the Program or use any Amazon trademark without Amazon's prior written approval, and ProdCo will keep confidential all non-public information relating to the Program ("NPI") [GIVE: and refrain from revealing such NPI to any entity or individual, except: [POSSIBLE GIVE: (a) as required to fulfill its obligations hereunder,] [POSSIBLE GIVE: (b) to its affiliates, employees, contractors, (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
15.	the Agreement. 10. TAX; GOVERNING LAW; JURISDICTION: Each party will be responsible for identifying and paying all taxes and other governmental fees and charges that are legally imposed on that party upon or with respect to the transactions and payments under this Agreement. All amounts to be paid by Amazon are [GIVE (WITH AMAZON TAX, FINANCE, AND BA APPROVAL ON A CASE-BY-CASE BASIS: DELETE: inclusive AND REPLACE WITH: exclusive]23 of all transaction taxes that ProdCo may be legally obligated to charge to Amazon on a valid tax invoice. [ALTERNATE GIVE (WITH AMAZON TAX, FINANCE, AND LEGAL REGIONAL LEAD (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 5)
16.	the transactions and payments under this Agreement. All amounts to be paid by Amazon are [GIVE (WITH AMAZON TAX, FINANCE, AND BA APPROVAL ON A CASE-BY-CASE BASIS: DELETE: inclusive AND REPLACE WITH: exclusive]23 of all transaction taxes that ProdCo may be legally obligated to charge to Amazon on a valid tax invoice. [ALTERNATE GIVE (WITH AMAZON TAX, FINANCE, AND LEGAL REGIONAL LEAD (e.g., Hendrik for International) APPROVAL ON A CASE-BY-CASE BASIS (see Footnote 41): On a season-by-season basis, upon request of ProdCo, Amazon will inform ProdCo in writing, before the first payment installment is due, of any change (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 5)
17.	and inure to the benefit of ProdCo and assignee.]29 ProdCo will execute and deliver all additional documents and do any other acts [GIVE: consistent herewith] as Amazon [GIVE: reasonably] requests in order to establish or evidence Amazon's rights hereunder , including, registration and assignment of the Materials. If ProdCo fails to do so within 5 [POSSIBLE 26 Amazon Position: If ProdCo objects to the extended waiver to Amazon's assignees, licensees and affiliates (or wishes to make this mutual), inform ProdCo that this waiver is broader for Amazon due to its nature as the financier and licensee of the (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 5)
18.	so will not affect the validity of such documents.] Amazon may elect to suspend any services, and any option exercise and/or other applicable dates under this Agreement will automatically extend, for a period of up to the length of (i) any unavailability, disability or death of any key personnel or cast, or any "force majeure" event (earthquake or other natural event, government action, labor dispute, acts of war or terrorism, epidemic, pandemic, or any other event beyond the control of Amazon), which interrupts or interferes with the Program ; and/or (ii) any claims or litigation relating to the (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 3)
19.	Amazon has sole and final control over the Program.4 ProdCo will not release or authorize any publicity or marketing relating to the Program or use any Amazon trademark without Amazon's prior written approval , and ProdCo will keep confidential all non-public information relating to the Program ("NPI") [GIVE: and refrain from revealing such NPI to any entity or individual, except: [POSSIBLE GIVE: (a) as required to fulfill its obligations hereunder,] [POSSIBLE GIVE: (b) to its affiliates, employees, contractors, agents or professional service providers (i.e., accountants, lawyers, and/or financial advisors) with a need to know such information, who are (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
20.	effective unless in written notice signed by Amazon. This Agreement includes and incorporates industry custom standard terms and conditions for agreements of this type, such as insurance and additional representations/warranties, indemnification and remedies. At Amazon's request [GIVE: or, if earlier, after Amazon's exercise of its option to order production of the initial season of the Program]19, these additional terms will be formalized as part of this Agreement subject to good faith negotiation within [GIVE: REMOVE: Amazon's customary parameters AND REPLACE WITH: customary industry parameters for agreements of this type]20; provided that unless and until such time, industry custom (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 4)
21.	preliminary action or measure for the same purpose. 5. FEES: If ProdCo is not in [GIVE: uncured, material]3 breach of this Agreement, subject to any other applicable 1 Note: The moral rights language may vary from country to country (depending on the applicable country's stance on the waiver of moral rights), so the language in this Section may not match the language for this concept in your country's PSA. Please raise with Amazon Legal to discuss in the event you receive material or repeated pushback on the language in this Section (otherwise, hold to form). 2 Amazon Position: (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx)
22.	specified in Exhibit A.5 6. ENTITLEMENTS; CREDIT: If ProdCo is not in [GIVE: uncured, material]6 breach of this Agreement, and completes ProdCo's services hereunder, subject to any other applicable terms and conditions (including any applicable guild/union requirements)7, ProdCo will receive the entitlements and credit specified in Exhibit A for the applicable episode(s). Except as otherwise specified herein, all aspects of credits will be at Amazon's sole discretion. Amazon's inadvertent failure to comply with such credit obligations will not constitute a breach of this Agreement, but upon receipt of written notice from ProdCo, Amazon will make commercially reasonable efforts (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 1)
23.	not in breach of this Agreement, subject to any ot The qualifier "uncured, material" may be added before ProdC If there are any qualifiers to the concept of breach, no other NTD: The acceptable deviations ("uncured, material breach") cYes Entitlements; Credit As you are the legal advisor of Amazon, the broader the defin The qualifier "uncured, material" may be added before ProdC If there are any qualifiers to the concept of breach, no other NTD: If any unacceptable qualifiers to the concept of breach a Yes… (PLAYBOOK_DSA_Amazon_20251029_100840 (back up playbooks).xlsx)
24.	qualifier "uncured, material" may be added before ProdC If there are any qualifiers to the concept of breach, no other NTD: The acceptable deviations ("uncured, material breach") cYes Entitlements; Credit As you are the legal advisor of Amazon, the broader the defin The qualifier "uncured, material" may be added before ProdC If there are any qualifiers to the concept of breach, no other NTD: If any unacceptable qualifiers to the concept of breach a Yes… (PLAYBOOK_DSA_Amazon_20251029_100840 (back up playbooks).xlsx)
25.	so will not affect the validity of such documents.] Amazon may elect to suspend any services, and any option exercise and/or other applicable dates under this Agreement will automatically extend, for a period of up to the length of (i) any unavailability, disability or death of any key personnel or cast, or any "force majeure" event (earthquake or other natural event, government action, labor dispute, acts of war or terrorism, epidemic, pandemic, or any other event beyond the control of Amazon), which interrupts or interferes with the Program; and/or (ii) any claims or litigation relating to the Program (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 3)
26.	OCTOBER 20, 2025 Page 2 of 10 terms and conditions4, ProdCo will receive the fees specified in Exhibit A. 5 6. ENTITLEMENTS; CREDIT: If ProdCo is not in [GIVE: uncured, material]6 breach of this Agreement, and completes ProdCo's services hereunder, subject to any other applicable terms and conditions (including any applicable guild/union requirements)7, ProdCo will receive the entitlements and credit specified in Exhibit A for the applicable episode(s). Except as otherwise specified herein, all aspects of credits will be at Amazon's sole discretion. Amazon's inadvertent failure to comply with such credit obligations will not constitute a breach of (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 1)
27.	assignment terms hereof) and in a form approved by Amazon. Any production order of the Program will not be effective unless in written notice signed by Amazon. This Agreement includes and incorporates industry custom standard terms and conditions for agreements of this type, such as insurance and additional representations/warranties, indemnification and remedies. At Amazon's request [GIVE: or, if earlier, after Amazon's exercise of its option to order production of the initial season of the Program]19, these additional terms will be formalized as part of this Agreement subject to good faith negotiation within [GIVE: REMOVE: Amazon's customary parameters AND (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 4)
28.	forth in Exhibit A.3 As between ProdCo and Amazon, Amazon has sole and final control over the Program. 4 ProdCo will not release or authorize any publicity or marketing relating to the Program or use any Amazon trademark without Amazon's prior written approval, and ProdCo will keep confidential all non-public information relating to the Program ("NPI") [GIVE: and refrain from revealing such NPI to any entity or individual, except: [POSSIBLE GIVE: (a) as required to fulfill its obligations hereunder,] [POSSIBLE GIVE: (b) to its affiliates, employees, contractors, agents or professional service providers (i.e., accountants, lawyers, and/or financial advisors) (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
29.	specified in Exhibit A for the applicable episode(s). Except as otherwise specified herein, all aspects of credits will be at Amazon's sole discretion. Amazon's inadvertent failure to comply with such credit obligations will not constitute a breach of this Agreement, but upon receipt of written notice from ProdCo, Amazon will make commercially reasonable efforts to correct any credit error by Amazon on a prospective basis. [GIVE: Amazon shall use reasonable efforts to inform all third parties with whom Amazon is in contractual privity of the credit obligations set forth herein, but is not responsible or liable to ProdCo (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 1)
30.	Agreement, and completes ProdCo's services hereunder, subject to any other applicable terms and conditions (including any applicable guild/union requirements) 7, ProdCo will receive the entitlements and credit specified in Exhibit A for the applicable episode(s). Except as otherwise specified herein, all aspects of credits will be at Amazon's sole discretion. Amazon's inadvertent failure to comply with such credit obligations will not constitute a breach of this Agreement, but upon receipt of written notice from ProdCo, Amazon will make commercially reasonable efforts to correct any credit error by Amazon on a prospective basis. [GIVE: Amazon shall use reasonable efforts (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 1)
31.	aspects of credits will be at Amazon's sole discretion. Amazon's inadvertent failure to comply with such credit obligations will not constitute a breach of this Agreement , but upon receipt of written notice from ProdCo, Amazon will make commercially reasonable efforts to correct any credit error by Amazon on a prospective basis. [GIVE: Amazon shall use reasonable efforts to inform all third parties with whom Amazon is in contractual privity of the credit obligations set forth herein, but is not responsible or liable to ProdCo for any failure of any third parties to comply with such credit obligations.]8[ALTERNATE (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 1)
32.	Amazon shall use reasonable efforts to inform all thirdparties with whom Amazon is in contractual privity of thecredit obligations set forth herein, but is not responsible or liable to ProdCo for any failure of any third parties to complywith such credit obligations. Only with Amazon Legal approval, the foregoing may bereplaced with the following: "Amazon shall contractually bindall third parties with whom Amazon is in contractual privity ofthe credit obligations set forth herein, but shall have noobligation to police same, nor shall Company be responsible or liable to ProdCo for the failure of any third party to comply (PLAYBOOK_DSA_Amazon_20251029_100840 (back up playbooks).xlsx)
33.	Agreement, but upon receipt of written notice from ProdCo, Amazon will make commercially reasonable efforts to correct any credit error by Amazon on a prospective basis. [GIVE: Amazon shall use reasonable efforts to inform all third parties with whom Amazon is in contractual privity of the credit obligations set forth herein, but is not responsible or liable to ProdCo for any failure of any third parties to comply with such credit obligations.]8[ALTERNATE GIVE (WITH AMAZON LEGAL APPROVAL): Amazon shall contractually bind all third parties with whom Amazon is in contractual privity of the credit obligations set forth herein, (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 1)
34.	credit error by Amazon on a prospective basis. [GIVE: Amazon shall use reasonable efforts to inform all third parties with whom Amazon is in contractual privity of the credit obligations set forth herein , but is not responsible or liable to ProdCo for any failure of any third parties to comply with such credit obligations.]8[ALTERNATE GIVE (WITH 
35.	
36.	Ç
37.	
38.	AMAZON LEGAL APPROVAL): Amazon shall contractually bind all third parties with whom Amazon is in contractual privity of the credit obligations set forth herein, but shall have no obligation to police same, nor shall Company be responsible or liable to ProdCo (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 1)
39.	with such credit obligations. Only with Amazon Legal approval, the foregoing may bereplaced with the following: "Amazon shall contractually bindall third parties with whom Amazon is in contractual privity ofthe credit obligations set forth herein, but shall have noobligation to police same , nor shall Company be responsible or liable to ProdCo for the failure of any third party to comply Third-Party Credit Obligations with the same." Do not impose responsibility on Amazon for third-party failureNTD: Favor the following language as first fallback: "Amazon s No… (PLAYBOOK_DSA_Amazon_20251029_100840 (back up playbooks).xlsx)
40.	any claim, encumbrance or third-party interest; (ii) ProdCo will comply with all control laws, and tax evasion and tax evasion facilitation laws), and (B)] Amazon's policies, requirements and guidelines/manuals of which ProdCo is made aware in advance (including Amazon's Development Kickoff Packet); and (iii) ProdCo is capable of and has the full right to enter into and perform under this Agreement. Each of Amazon and ProdCo represents, warrants and agrees that such party has measures in place designed to ensure compliance with applicable laws, rules and regulations (including import/re-import, sanctions, anti-boycott, export/re-export control laws and tax evasion and (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
41.	with such credit obligations. Only with Amazon Legal approval, the foregoing may bereplaced with the following: "Amazon shall contractually bindall third parties with whom Amazon is in contractual privity ofthe credit obligations set forth herein, but shall have noobligation to police same, nor shall Company be responsible or liable to ProdCo for the failure of any third party to comply  Third-Party Credit Obligations with the same." Do not impose responsibility on Amazon for third-party failureNTD: Favor the following language as first fallback: "Amazon s No… (PLAYBOOK_DSA_Amazon_20251029_100840 (back up playbooks).xlsx)
42.	obligations.]8[ALTERNATE GIVE (WITH AMAZON LEGAL APPROVAL): Amazon shall contractually bind all third parties with whom Amazon is in contractual privity of the credit obligations set forth herein, but shall have no obligation to police same, nor shall Company be responsible or liable to ProdCo for the failure of any third party to comply with the same.]9 7… (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 1)
43.	REPRESENTATIONS/WARRANTIES; INDEMNITY: ProdCo represents, warrants and agrees that: (i) the Program (including all materials previously created for the Program) and Materials are original and qualify for full copyright protection (other than materials supplied to ProdCo by Amazon and/or materials supplied by ProdCo at Amazon's explicit request and/or direction, or any elements in the public domain), will not infringe or violate any intellectual property rights (including any copyright) of, and will not defame, infringe or violate the rights of privacy or any other rights of any person or entity, and are not subject to any claim, encumbrance or third-party (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
44.	third-party interest; (ii) ProdCo will comply with all  control laws, and tax evasion and tax evasion facilitation laws), and (B)] Amazon's policies, requirements and guidelines/manuals of which ProdCo is made aware in advance (including Amazon's Development Kickoff Packet); and (iii) ProdCo is capable of and has the full right to enter into and perform under this Agreement. Each of Amazon and ProdCo represents, warrants and agrees that such party has measures in place designed to ensure compliance with applicable laws, rules and regulations (including import/re-import, sanctions, anti-boycott, export/re-export control laws and tax evasion and tax evasion facilitation (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
45.	(including Amazon's Development Kickoff Packet); and (iii) ProdCo is capable of and has the full right to enter into and perform under this Agreement. Each of Amazon and ProdCo represents, warrants and agrees that such party has measures in place designed to ensure compliance with applicable laws, rules and regulations (including import/re-import, sanctions, anti-boycott, export/re-export control laws and tax evasion and tax evasion facilitation laws). ProdCo will indemnify, defend (at Amazon's option), and hold harmless Amazon and its assignees, licensees, and each of their affiliates against any losses, liability, damages, judgements, cost or expenses ("Losses") arising out of (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
46.	all elements thereof, the "Program"). 4. RIGHTS1: All rights in the Program, including all materials commissioned (including the results and proceeds of the services rendered hereunder) or previously created by or on behalf of ProdCo for the Program (the "Materials") shall be owned by Amazon exclusively, throughout the universe, in perpetuity (or for the maximum legal term of protection, if shorter). 2 The Materials constitute "works made for hire" / commissioned works for and by Amazon and, therefore, all rights therein will vest in Amazon, immediately upon creation. If and to the extent the foregoing does not operate (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx)
47.	property rights (including any copyright) of, and will not defame, infringe or violate the rights of privacy or any other rights of any person or entity, and are not subject to any claim, encumbrance or third-party interest; (ii) ProdCo will comply with all control laws, and tax evasion and tax evasion facilitation laws), and (B)] Amazon's policies, requirements and guidelines/manuals of which ProdCo is made aware in advance (including Amazon's Development Kickoff Packet); and (iii) ProdCo is capable of and has the full right to enter into and perform under this Agreement. Each of Amazon and ProdCo represents, (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
48.	protection, if shorter), as and when they are created, all rights now known or hereafter devised (including under copyright, trademark, and performers' rights) in and to the Materials and the Program (including all materials previously created for the Program) and all parts thereof, in all media and distribution modes whether currently known or hereafter devised.… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx)
49.	Program, including all materials commissioned (including the results and proceeds of the services rendered hereunder ) or previously created by or on behalf of ProdCo for the Program (the "Materials") shall be owned by Amazon exclusively, throughout the universe, in perpetuity (or for the maximum legal term of protection, if shorter).2 The Materials constitute "works made for hire" / commissioned works for and by Amazon and, therefore, all rights therein will vest in Amazon, immediately upon creation. If and to the extent the foregoing does not operate to fully vest in Amazon all such rights, ProdCo hereby irrevocably (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx)
50.	connection with the Materials are work made for hire and the rights to the Program, itself, will be owned 100% by Amazon. PSA FALLBACKS AS OF OCTOBER 20, 2025 Page 2 of 7 7… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx)
51.	the maximum legal term of protection, if shorter).2 The Materials constitute "works made for hire" / commissioned works for and by Amazon and, therefore, all rights therein will vest in Amazon, immediately upon creation. If and to the extent the foregoing does not operate to fully vest in Amazon all such rights, ProdCo hereby irrevocably grants, transfers and assigns to Amazon, exclusively, throughout the universe, in perpetuity (or for the maximum legal term of protection, if shorter), as and when they are created, all rights now known or hereafter devised (including under copyright, trademark, and performers' rights) in (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx)
52.	entity. We're unable to accommodate ProdCo's request. Amazon recognizes a line item in the budget for E&O insurance funded by Amazon that covers these types of claims regardless of ProdCo's level of negligence or intent, provided there is no fraud, so it is more appropriate for insurance to cover the claim then to transfer this obligation to Amazon. In addition, Amazon does not accept a knowledge qualifier on claims based on strict liability (such as copyright infringement) or claims that are not dependent on knowledge or willful misconduct (such as defamation claims which can be made based on (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 2)
53.	evasion and tax evasion facilitation laws), and (B)] Amazon's policies, requirements and guidelines/manuals of which ProdCo is made aware in advance (including Amazon's Development Kickoff Packet); and (iii) ProdCo is capable of and has the full right to enter into and perform under this Agreement. Each of Amazon and ProdCo represents, warrants and agrees that such party has measures in place designed to ensure compliance with applicable laws, rules and regulations (including import/re-import, sanctions, anti-boycott, export/re-export control laws and tax evasion and tax evasion facilitation laws). ProdCo will indemnify, defend (at Amazon's option), and hold harmless Amazon and (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
54.	SUCH PERSONAL JURISDICTION/VENUE). AND REPLACE WITH: This Agreement will be governed and construed in accordance with the internal laws of the State of New York applicable to contracts entered into and fully to be performed therein. The parties consent and agree to the exclusive jurisdiction and venue of the state and federal courts having jurisdiction over New York, New York, with respect to any action that any party desires to commence arising out of or in connection with this Agreement or any breach or alleged breach of any provision of this Agreement… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 6)
55.	this sentence (as requested). 20 Amazon Position: Amazon must be able to control its own defense. That said, ProdCo may have its own counsel present so long as it does not interfere. That said, in order to grant this right, we must include additional language clarifying the control of such defense. PSA FALLBACKS AS OF OCTOBER 20, 2025 Page 5 of 10 8. MISCELLANEOUS (CONDITIONS PRECEDENT, DAMAGES, INJUNCTIVE RELIEF, ASSIGNMENT, ETC… (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 3)
56.	Amazon will indemnify, defend, and hold harmless ProdCo and its affiliates, and successors against any Losses arising out of any third-party claim in connection with the distribution marketing and exploitation of the Program and all ancillary rights therein and thereto by Amazon or its affiliates, other than with respect to any Losses for which ProdCo is required to indemnify Amazon under this Agreement. If either Amazon or Prodco is entitled to defense or indemnification hereunder, the indemnitee will give the indemnifying party prompt written notice of the applicable claim (but any delay in notification will not relieve the (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
57.	trademark without Amazon's prior written approval, and ProdCo will keep confidential all non-public information relating to the Program ("NPI") [GIVE: and refrain from revealing such NPI to any entity or individual, except: [POSSIBLE GIVE: (a) as required to fulfill its obligations hereunder,] [POSSIBLE GIVE: (b) to its affiliates, employees, contractors, agents or professional service providers (i.e., accountants, lawyers, and/or financial advisors) with a need to know such information, who are bound to maintain the confidentiality of such information under terms substantially similar to those of this Agreement,] [POSSIBLE GIVE: (c) as expressly permitted in writing by Amazon,] or (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
58.	ProdCo hereby irrevocably waives (and will cause all individuals ProdCo engages for the Program to waive) all so-called "moral rights" or "droit moral" and any similar or analogous rights to the maximum extent permitted under applicable law. To the extent that moral rights cannot be waived or assigned under applicable law, ProdCo irrevocably agrees (and will cause all individuals ProdCo engages for the Program to agree) not to exercise any right or institute any action with respect to such moral rights that would hinder, burden or stop the use and commercial exploitation of the Materials and/or the Program, (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx)
59.	to transfer this obligation to Amazon. In addition, Amazon does not accept a knowledge qualifier on claims based on strict liability (such as copyright infringement) or claims that are not dependent on knowledge or willful misconduct (such as defamation claims which can be made based on mere negligence depending on the status of the individual allegedly defamed and the territory in which the plaintiff resides). Finally, even if the "reasonably prudent" standard ultimately protected Amazon, at the time litigation is filed, it is often too early to determine the ProdCo's level of culpability or whether ProdCo exercised "reasonable (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 2)
60.	any claim, encumbrance or third-party interest; (ii) ProdCo will comply with all control laws, and tax evasion and tax evasion facilitation laws), and (B)] Amazon's policies, requirements and guidelines/manuals of which ProdCo is made aware in advance (including Amazon's Development Kickoff Packet); and (iii) ProdCo is capable of and has the full right to enter into and perform under this Agreement. Each of Amazon and ProdCo represents, warrants and agrees that such party has measures in place designed to ensure compliance with applicable laws, rules and regulations (including import/re-import, sanctions, anti-boycott, export/re-export control laws and tax evasion and (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
61.	claim, encumbrance or third-party interest11; (ii) ProdCo will comply with all [GIVE DELETE WITH AMAZON LEGAL APPROVAL: (A) applicable laws, rules and regulations (including import [EXAMPLE GIVE DELETE WITH AMAZON LEGAL APPROVAL:/re- import]12, sanctions, anti-boycott, export/ [EXAMPLE GIVE DELETE (WITH AMAZON LEGAL APPROVAL) (see Footnote 12): re-export] control laws, and tax evasion and tax evasion facilitation laws), and (B)]13 Amazon's policies, requirements and guidelines/manuals of which ProdCo is made aware in advance [GIVE: (including Amazon's Development Kickoff Packet)]14; and (iii) ProdCo is capable of and has the full right to enter into and perform under this Agreement. [GIVE (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 2)
62.	trademark without Amazon's prior written approval, and ProdCo will keep confidential all non-public information relating to the Program ("NPI") [GIVE: and refrain from revealing such NPI to any entity or individual, except: [POSSIBLE GIVE: (a) as required to fulfill its obligations hereunder,] [POSSIBLE GIVE: (b) to its affiliates, employees, contractors, agents or professional service providers (i.e., accountants, lawyers, and/or financial advisors) with a need to know such information, who are bound to maintain the confidentiality of such information under terms substantially similar to those of this Agreement,] [POSSIBLE GIVE: (c) as expressly permitted in writing by Amazon,] or (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
63.	language in this Section (otherwise, hold to form). 2 Amazon Position: If ProdCo asks to carve out pre-existing agreements or materials from this rights grant, Amazon does not modify this language. If there are underlying rights agreements, Amazon will take assignment of (and possibly amend) these agreements pursuant to separate paperwork between the parties, but must generally be clear that all results and proceeds in connection with the Materials are work made for hire and the rights to the Program, itself, will be owned 100% by Amazon. PSA FALLBACKS AS OF OCTOBER 20, 2025 Page 2 of 7 (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx)
64.	Section (otherwise, hold to form). 2 Amazon Position: If ProdCo asks to carve out pre-existing agreements or materials from this rights grant, Amazon does not modify this language. If there are underlying rights agreements, Amazon will take assignment of (and possibly amend) these agreements pursuant to separate paperwork between the parties, but must generally be clear that all results and proceeds in connection with the Materials are work made for hire and the rights to the Program, itself, will be owned 100% by Amazon. PSA FALLBACKS AS OF OCTOBER 20, 2025 Page 2 of 7 7… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx)
65.	REPRESENTATIONS/WARRANTIES; INDEMNITY: ProdCo represents, warrants and agrees that: (i) the Program (including all materials previously created for the Program) and Materials are original and qualify for full copyright protection (other than materials supplied to ProdCo by Amazon and/or materials supplied by ProdCo at Amazon's explicit request and/or direction, or any elements in the public domain), will not infringe or violate any intellectual property rights (including any copyright) of, and will not defame, infringe or violate the rights of privacy or any other rights of any person or entity, and are not subject to any claim, encumbrance or third-party (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
66.	any claim, encumbrance or third-party interest; (ii) ProdCo will comply with all control laws, and tax evasion and tax evasion facilitation laws ), and (B)] Amazon's policies, requirements and guidelines/manuals of which ProdCo is made aware in advance (including Amazon's Development Kickoff Packet); and (iii) ProdCo is capable of and has the full right to enter into and perform under this Agreement. Each of Amazon and ProdCo represents, warrants and agrees that such party has measures in place designed to ensure compliance with applicable laws, rules and regulations (including import/re-import, sanctions, anti-boycott, export/re-export control laws and tax evasion (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
67.	and tax evasion and tax evasion facilitation laws). ProdCo will indemnify, defend (at Amazon's option), and hold harmless Amazon and its assignees, licensees, and each of their affiliates against any losses, liability, damages, judgements, cost or expenses ("Losses") arising out of any third-party claim in connection with the development and production by ProdCo of the Program, ProdCo's breach of any of its agreements, representations or warranties under this Agreement and/or ProdCo's negligence or willful misconduct… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
68.	entity. We're unable to accommodate ProdCo's request. Amazon recognizes a line item in the budget for E&O insurance funded by Amazon that covers these types of claims regardless of ProdCo's level of negligence or intent , provided there is no fraud, so it is more appropriate for insurance to cover the claim then to transfer this obligation to Amazon. In addition, Amazon does not accept a knowledge qualifier on claims based on strict liability (such as copyright infringement) or claims that are not dependent on knowledge or willful misconduct (such as defamation claims which can be made based (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 2)
69.	REPRESENTATIONS/WARRANTIES; INDEMNITY: ProdCo represents, warrants and agrees that: (i) the Program (including all materials previously created for the Program) and Materials are original and qualify for full copyright protection (other than materials supplied to ProdCo by Amazon and/or materials supplied by ProdCo at Amazon's explicit request and/or direction, or any elements in the public domain), will not infringe or violate any intellectual property rights (including any copyright) of, and will not defame, infringe or violate the rights of privacy or any other rights of any person or entity, and are not subject to any claim, encumbrance or third-party (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
70.	Amazon has sole and final control over the Program.4 ProdCo will not release or authorize any publicity or marketing relating to the Program or use any Amazon trademark without Amazon's prior written approval, and ProdCo will keep confidential all non-public information relating to the Program ("NPI") [GIVE: and refrain from revealing such NPI to any entity or individual, except: [POSSIBLE GIVE: (a) as required to fulfill its obligations hereunder,] [POSSIBLE GIVE: (b) to its affiliates, employees, contractors, agents or professional service providers (i.e., accountants, lawyers, and/or financial advisors) with a need to know such information, who are bound (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
71.	any conditions precedent set forth in Exhibit A.3 As between ProdCo and Amazon, Amazon has sole and final control over the Program. 4 ProdCo will not release or authorize any publicity or marketing relating to the Program or use any Amazon trademark without Amazon's prior written approval, and ProdCo will keep confidential all non-public information relating to the Program ("NPI") [GIVE: and refrain from revealing such NPI to any entity or individual, except: [POSSIBLE GIVE: (a) as required to fulfill its obligations hereunder,] [POSSIBLE GIVE: (b) to its affiliates, employees, contractors, agents or professional service providers (i.e., accountants, (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
72.	to control the defense and settlement of any claim. In addition, ProdCo will have the right to participate, at its own expense and with counsel of its own choosing, in the defense of any claim. 8. MISCELLANEOUS (CONDITIONS PRECEDENT, DAMAGES, INJUNCTIVE RELIEF, ASSIGNMENT, ETC… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
73.	control the defense and settlement of any claim, but Amazon may not, without the prior written approval of ProdCo (which may not be unreasonably withheld), enter into or acquiesce to any settlement that contains any admission of or stipulation to any guilt, fault, liability or wrongdoing on the part of ProdCo or that imposes any restrictions, obligations, or liabilities on ProdCo , and ProdCo will cooperate reasonably with Amazon Representations/Warranties, Indemnity 1 and provide all information and assistance as Amazon may Any language governing defence of a claim that is different th NTD: Include the fallback only if (PLAYBOOK_DSA_Amazon_20251029_100840 (back up playbooks).xlsx)
74.	the Program, itself, will be owned 100% by Amazon. 3 Amazon Position: Generally OK to add these qualifiers before ProdCo's "breach" in Sections 5 and 6 (however do not add for ProdCo's indemnity in Section 7).… (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx)
75.	and tax evasion and tax evasion facilitation laws). ProdCo will indemnify, defend (at Amazon's option), and hold harmless Amazon and its assignees, licensees, and each of their affiliates against any losses, liability, damages, judgements, cost or expenses ("Losses") arising out of any third-party claim in connection with the development and production by ProdCo of the Program , ProdCo's breach of any of its agreements, representations or warranties under this Agreement and/or ProdCo's negligence or willful misconduct… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
76.	REPRESENTATIONS/WARRANTIES; INDEMNITY: ProdCo represents, warrants and agrees that: (i) the Program (including all materials previously created for the Program) and Materials are original and qualify for full copyright protection (other than materials supplied to ProdCo by Amazon and/or materials supplied by ProdCo at Amazon's explicit request and/or direction, or any elements in the public domain), will not infringe or violate any intellectual property rights (including any copyright) of, and will not defame, infringe or violate the rights of privacy or any other rights of any person or entity , and are not subject to any claim, encumbrance or (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
77.	including" shall mean "including but not limited to". This Agreement does not create any partnership, joint venture or agency relationship between the parties.… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 2)
78.	to ensure compliance] [POSSIBLE GIVE 2: will mater ially comply] with applicable laws, rules and regulations (including import/re-import, sanctions, anti-boycott, export/re-export control laws and tax evasion and tax evasion facilitation laws). ]… (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 2)
79.	evasion and tax evasion facilitation laws), and (B)] Amazon's policies, requirements and guidelines/manuals of which ProdCo is made aware in advance (including Amazon's Development Kickoff Packet) ; and (iii) ProdCo is capable of and has the full right to enter into and perform under this Agreement. Each of Amazon and ProdCo represents, warrants and agrees that such party has measures in place designed to ensure compliance with applicable laws, rules and regulations (including import/re-import, sanctions, anti-boycott, export/re-export control laws and tax evasion and tax evasion facilitation laws). ProdCo will indemnify, defend (at Amazon's option), and hold harmless Amazon (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
80.	any claim, encumbrance or third-party interest; (ii) ProdCo will comply with all control laws, and tax evasion and tax evasion facilitation laws), and (B)] Amazon's policies, requirements and guidelines/manuals of which ProdCo is made aware in advance (including Amazon's Development Kickoff Packet); and (iii) ProdCo is capable of and has the full right to enter into and perform under this Agreement. Each of Amazon and ProdCo represents, warrants and agrees that such party has measures in place designed to ensure compliance with applicable laws, rules and regulations (including import/re-import, sanctions, anti-boycott, export/re-export control laws and tax evasion and (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
81.	Amazon will indemnify, defend, and hold harmless ProdCo and its affiliates, and successors against any Losses arising out of any third-party claim in connection with the distribution marketing and exploitation of the Program and all ancillary rights therein and thereto by Amazon or its affiliates, other than with respect to any Losses for which ProdCo is required to indemnify Amazon under this Agreement. If either Amazon or Prodco is entitled to defense or indemnification hereunder, the indemnitee will give the indemnifying party prompt written notice of the applicable claim (but any delay in notification will not relieve the (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
82.	[GIVE: Amazon shall confirm the suspension in writing, provided that no inadvertent failure by Amazon to deliver notice of suspension will be deemed a breach of this Agreement or in any way affect the effectiveness of such suspension. ]1718 ProdCo has or will obtain signed agreements from each principal, employee or other individual prior to rendering services in connection with the Program on terms consistent with this Agreement (including rights and assignment terms hereof) and in a form approved by Amazon. Any production order of the Program will not be effective unless in written notice signed by Amazon. (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 4)
83.	ProdCo may not assign this Agreement or any rights or obligations without Amazon's prior written consent. This Agreement, in whole or in part (including rights and obligations), may be freely assigned by Amazon, and any such assignment will be binding upon ProdCo and inure to the benefit of such assignee [GIVE:; provided that Amazon will remain secondarily liable hereunder unless the assignee assumes in writing all of Amazon's obligations as of the date of such assignment or [GIVE: REMOVE: "or" and REPLACE with: "and"] such assignee is: (i) a so-called "major", "mini-major" or "major independent" motion picture company, (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 2)
84.	development and production by ProdCo of the Program, ProdCo's breach of any of its agreements, representations or warranties under this Agreement and/or ProdCo's negligence or willful misconduct.… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
85.	representations or warranties under this Agreement and/or ProdCo's negligence or willful misconduct.… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
86.	indemnifying party's ability to defend such claim). Amazon will have the option to control the defense and settlement of any claim. In addition, ProdCo will have the right to participate, at its own expense and with counsel of its own choosing, in the defense of any claim. 8. MISCELLANEOUS (CONDITIONS PRECEDENT, DAMAGES, INJUNCTIVE RELIEF, ASSIGNMENT, ETC… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
87.	and performers' rights) in and to the Materials and the Program (including all materials previously created for the Program) and all parts thereof, in all media and distribution modes whether currently known or hereafter devised… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx)
88.	previously created for the Program) and all parts thereof, in all media and distribution modes whether currently known or hereafter devised.… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx)
89.	party prompt written notice of the applicable claim ( but any delay in notification will not relieve the indemnifying party of its indemnification obligations under this Agreement except to the extent that such delay materially impairs the indemnifying party's ability to defend such claim). Amazon will have the option to control the defense and settlement of any claim and ProdCo will cooperate reasonably with Amazon and provide all information and assistance as Amazon may reasonably… (PLAYBOOK_DSA_Amazon_20251029_100840 (back up playbooks).xlsx)
90.	liability, damages, judgements, cost or expenses ("Losses") arising out of any third-party claim in connection with the development and production by ProdCo of the Program , ProdCo's breach of any of its agreements, representations or warranties under this Agreement and/or ProdCo's negligence or willful misconduct… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
91.	assignees, licensees, and each of their affiliates against any losses, liability, damages, judgements, cost or expenses ("Losses") arising out of any third-party claim in connection with the development and production by ProdCo of the Program, ProdCo's breach of any of its agreements, representations or warranties under this Agreement and/or ProdCo's negligence or willful misconduct… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
92.	restrictions, obligations, or liabilities on ProdCo,] and ProdCo will cooperate reasonably with Amazon and provide all information and assistance as Amazon may reasonably require in connection with the defense and settlement of such claim.… (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 3)
93.	Amazon has sole and final control over the Program.4 ProdCo will not release or authorize any publicity or marketing relating to the Program or use any Amazon trademark without Amazon's prior written approval, and ProdCo will keep confidential all non-public information relating to the Program ("NPI") [GIVE: and refrain from revealing such NPI to any entity or individual, except: [POSSIBLE GIVE: (a) as required to fulfill its obligations hereunder,] [POSSIBLE GIVE: (b) to its affiliates, employees, contractors, agents or professional service providers (i.e., accountants, lawyers, and/or financial advisors) with a need to know such information, who are bound (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
94.	defense and settlement of any claim. In addition, ProdCo will have the right to participate, at its own expense and with counsel of its own choosing, in the defense of any claim. 8. MISCELLANEOUS (CONDITIONS PRECEDENT, DAMAGES, INJUNCTIVE RELIEF, ASSIGNMENT, ETC… (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
95.	required to indemnify Amazon under this Agreement. If either Amazon or Prodco is entitled to defense or indemnification hereunder, the indemnitee will give the indemnifying party prompt written notice of the applicable claim (but any delay in notification will not relieve the indemnifying party of its indemnification obligations under this Agreement except to the extent that such delay materially impairs the indemnifying party's ability to defend such claim). Amazon will have the option to control the defense and settlement of any claim. In addition, ProdCo will have the right to participate, at its own expense and with counsel (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
96.	indemnifying party's ability to defend such claim). Amazon will have the option to control the defense and settlement of any claim [POSSIBLE GIVE:, but Amazon may not, without the prior written approval of ProdCo (which may not be unreasonably withheld), enter into or acquiesce to any settlement that contains any admission of or stipulation to any guilt, fault, liability or wrongdoing on the part of ProdCo or that imposes any restrictions, obligations, or liabilities on ProdCo,] and ProdCo will cooperate reasonably with Amazon and provide all information and assistance as Amazon may reasonably require in connection with the (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 3)
97.	indemnifying party's ability to defend such claim). Amazon will have the option to control the defense and settlement of any claim, but Amazon may not, without the prior written approval of ProdCo (which may not be unreasonably withheld), enter into or acquiesce to any settlement that contains any admission of or stipulation to any guilt, fault, liability or wrongdoing on the part of ProdCo or that imposes any restrictions, obligations, or liabilities on ProdCo, and ProdCo will cooperate reasonably with Amazon Representations/Warranties, Indemnity 1 and provide all information and assistance as Amazon may Any language governing defence of (PLAYBOOK_DSA_Amazon_20251029_100840 (back up playbooks).xlsx)
98.	indemnifying party's ability to defend such claim). Amazon will have the option to control the defense and settlement of any claim, but Amazon may not, without the prior written approval of ProdCo (which may not be unreasonably withheld), enter into or acquiesce to any settlement that contains any admission of or stipulation to any guilt, fault, liability or wrongdoing on the part of ProdCo or that imposes any restrictions, obligations, or liabilities on ProdCo , and ProdCo will cooperate reasonably with Amazon Representations/Warranties, Indemnity 1 and provide all information and assistance as Amazon may Any language governing defence (PLAYBOOK_DSA_Amazon_20251029_100840 (back up playbooks).xlsx)
99.	ProdCo acknowledges is reasonable and sufficient) and ProdCo hereby irrevocably and perpetually waives any right to seek or obtain injunctive or other equitable relief or to otherwise enjoin or restrain the development, production, distribution, promotion, or other exploitation of the Program (or any part thereof or rights therein). 9 If any term of this Agreement is held to be invalid or unenforceable, then the term so affected will be limited only to the extent necessary and the remaining terms of this Agreement will not be affected and will be valid and enforceable to the fullest extent permitted by (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 2)
100.	connection with the defense and settlement of such claim. If either Amazon or Prodco is entitled to defense or indemnification hereunder, the indemnitee will give the indemnifying party prompt written notice of the applicable claim (but any delay in notification will not relieve the… (PLAYBOOK_DSA_Amazon_20251029_100840 (back up playbooks).xlsx)
101.	EXCEPT [GIVE (WITH REPEATED PUSHBACK): [REMOVE: FOR THE INDEMNIFICATION OBLIGATIONS AND] AND ADD: TO THE EXTENT ARISING FROM ANY THIRD-PARTY CLAIM UNDER THE APPLICABLE PARTY'S INDEMNITY OBLIGATION HEREUNDER OR FROM]6 ANY BREACH OF CONFIDENTIALITY AS SET FORTH HEREIN, EACH PARTY HEREBY WAIVES ALL CLAIMS AGAINST THE OTHER PARTY [GIVE: [REMOVE: (IN CASE OF AMAZON, PRODCO WAIVES ALL CLAIMS AGAINST AMAZON AND ITS ASSIGNEES, LICENSEES, AND EACH OF THEIR AFFILIATES)] AND ADD AT END OF SENTENCE: (IN CASE OF AMAZON, PRODCO WAIVES ALL SUCH CLAIMS AGAINST AMAZON AND ITS ASSIGNEES, LICENSEES, AND EACH OF THEIR AFFILIATES)]7 HEREUNDER FOR INDIRECT, (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 2)
102.	entitled to defense or indemnification hereunder, the indemnitee will give the indemnifying party prompt written notice of the applicable claim (but any delay in notification will not relieve the… (PLAYBOOK_DSA_Amazon_20251029_100840 (back up playbooks).xlsx)
103.	affect the effectiveness of such suspension.]1718 ProdCo has or will obtain signed agreements from each principal, employee or other individual prior to rendering services in connection with the Program on terms consistent with this Agreement (including rights and assignment terms hereof) and in a form approved by Amazon. Any production order of the Program will not be effective unless in written notice signed by Amazon. This Agreement includes and incorporates industry custom standard terms and conditions for agreements of this type, such as insurance and additional representations/warranties, indemnification and remedies. At Amazon's request [GIVE: or, if earlier, after (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 4)
104.	must be able to control its own defense. That said, ProdCo may have its own counsel present so long as it does not interfere. That said, in order to grant this right, we must include additional language clarifying the control of such defense. PSA FALLBACKS AS OF OCTOBER 20, 2025 Page 5 of 10 8. MISCELLANEOUS (CONDITIONS PRECEDENT, DAMAGES, INJUNCTIVE RELIEF, ASSIGNMENT, ETC… (PSA Principal Terms Fallback Guide (20 October 2025)(20251021_173610).docx, Page 3)
105.	control the defense and settlement of any claim, but Amazon may not, without the prior written approval of ProdCo (which may not be unreasonably withheld), enter into or acquiesce to any settlement that contains any admission of or stipulation to any guilt, fault, liability or wrongdoing on the part of ProdCo or that imposes any restrictions, obligations, or liabilities on ProdCo, and ProdCo will cooperate reasonably with Amazon Representations/Warranties, Indemnity 1 and provide all information and assistance as Amazon may Any language governing defence of a claim that is different th NTD: Include the fallback only if additions (PLAYBOOK_DSA_Amazon_20251029_100840 (back up playbooks).xlsx)
106.	ProdCo may review and comment on such document)], ProdCo hereby irrevocably authorizes Amazon to act on ProdCo's behalf, including by providing Amazon with a [GIVE: limited] power of attorney (coupled with an interest) solely to execute, register and record such documents on ProdCo's behalf. [GIVE: Amazon will provide ProdCo with copies of such documents so executed promptly thereafter, provided that inadvertent failure to do so will not be deemed a breach of this Agreement and any failure to do so will not affect the validity of such documents.] Amazon may elect to suspend any services, and any option (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 3)
107.	trademark without Amazon's prior written approval, and ProdCo will keep confidential all non-public information relating to the Program ("NPI") [GIVE: and refrain from revealing such NPI to any entity or individual , except: [POSSIBLE GIVE: (a) as required to fulfill its obligations hereunder,] [POSSIBLE GIVE: (b) to its affiliates, employees, contractors, agents or professional service providers (i.e., accountants, lawyers, and/or financial advisors) with a need to know such information, who are bound to maintain the confidentiality of such information under terms substantially similar to those of this Agreement,] [POSSIBLE GIVE: (c) as expressly permitted in writing by Amazon,] (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
108.	and tax evasion and tax evasion facilitation laws). ProdCo will indemnify, defend (at Amazon's option), and hold harmless Amazon and its assignees, licensees, and each of their affiliates against any losses, liability, damages, judgements, cost or expenses ("Losses") arising out of any third-party claim in connection with the development and production by ProdCo of the Program, ProdCo's breach of any of its agreements, representations or warranties under this Agreement and/or ProdCo's negligence or willful misconduct.Amazon will indemnify, defend, and hold harmless ProdCo and its affiliates, and successors against any Losses arising out of any third-party claim in connection (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 1)
109.	ProdCo may not assign this Agreement or any rights or obligations without Amazon's prior written consent. This Agreement, in whole or in part (including rights and obligations), may be freely assigned by Amazon, and any such assignment will be binding upon ProdCo and inure to the benefit of such assignee [GIVE:; provided that Amazon will remain secondarily liable hereunder unless the assignee assumes in writing all of Amazon's obligations as of the date of such assignment or [GIVE: REMOVE: "or" and REPLACE with: "and"] such assignee is: (i) a so-called "major", "mini-major" or "major independent" motion picture company, (PSA Principal Terms Fallback Guide (20 October 2025) - Prueba 1.docx, Page 2)





