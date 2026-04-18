#set page(
  paper: "a4",
  margin: (x: 2.5cm, y: 2cm),
)

#set text(
  font: "Arial",
  size: 11pt,
  lang: "es",
)

#set smartquote(enabled: false)

#set par(
  justify: true,
  leading: 0.65em,
)

#set heading(numbering: "1.")

#align(center)[
  #v(1cm)

  #text(16pt, weight: "bold")[
    Universidad Autónoma de Querétaro
  ]

  #v(0.5cm)

  #text(13pt)[
    Facultad de Informática
  ]

  #v(0.3cm)

  #text(12pt)[
    Ingeniería en Software
  ]

  #v(2cm)

  #text(18pt, weight: "bold")[
    Hackathon Troyano 2026
  ]

  #v(0.3cm)

  #text(16pt, weight: "bold", fill: rgb("#1976D2"))[
    Soledad en adultos mayores y el rol de compañeros virtuales con IA
  ]

  #v(0.5cm)

  #text(14pt)[
    Investigación de contexto — Proyecto Lumi
  ]

  #v(3.5cm)

  #grid(
    columns: 2,
    gutter: 2cm,
    [
      *Equipo:*\
      Lumi Team\
      \
      *Evento:*\
      Hackathon Troyano 2026\
      FIF UAQ
    ],
    [
      *Tema:*\
      Open Innovation Challenge:\
      IA para Impacto en el Mundo Real\
      \
      *Fecha:*\
      #datetime.today().display()
    ]
  )
]

#pagebreak()

#outline(
  title: [Índice],
  indent: auto,
  depth: 2,
)

#pagebreak()

#set page(
  footer: context [
    #h(1fr)
    #counter(page).display() de #counter(page).final().first()
  ],
)
#counter(page).update(1)

= Introducción

En México, el envejecimiento poblacional avanza a un ritmo acelerado. Según el Censo de Población y Vivienda 2020 del INEGI, el país cuenta con aproximadamente 17.9 millones de personas de 60 años o más, lo que representa el 14.2% de la población total. Las proyecciones del CONAPO estiman que esta cifra alcanzará los 33 millones para 2050 --- más del 21% de la población.

Este cambio demográfico trae consigo un problema que pocas veces se aborda con tecnología: la soledad y el aislamiento social de los adultos mayores. De acuerdo con la ENADID 2018, aproximadamente 1.7 millones de personas mayores de 60 años viven completamente solas en México, y muchas más reportan sentirse aisladas aun viviendo acompañadas.

El presente documento investiga la magnitud de este problema, sus efectos en la salud, y cómo un compañero virtual basado en inteligencia artificial --- como Lumi --- puede ofrecer una solución accesible, cálida y funcional para adultos mayores y sus familias.

= Contexto: la soledad como problema de salud pública

== Panorama en México

La ENSANUT 2018-19 encontró que aproximadamente el 17.6% de los adultos de 65 años o más presentan síntomas depresivos. Estudios regionales elevan esta cifra al 25-30%, especialmente en zonas rurales y entre mujeres (Berenzon et al., _Salud Pública de México_). El Instituto Nacional de Geriatría identifica la soledad y el aislamiento social como factores de riesgo principales para la salud mental de los adultos mayores mexicanos.

La brecha digital agrava el problema: según la ENDUTIH 2022 del INEGI, solo el 20-25% de los adultos de 65 años o más usan internet, frente al promedio nacional del 75%. Esto significa que las soluciones basadas en apps o redes sociales no alcanzan a la población que más las necesita.

#figure(
  table(
    columns: 3,
    fill: (_, row) => if row == 0 { rgb("#E3F2FD") } else if calc.odd(row) { rgb("#F5F5F5") },
    table.header(
      [*Indicador*], [*Valor*], [*Fuente*],
    ),
    [Adultos 60+ en México (2020)], [17.9 millones], [INEGI, Censo 2020],
    [Proyección 60+ al 2050], [~33 millones], [CONAPO],
    [Adultos mayores que viven solos], [11-16%], [INEGI, ENADID 2018],
    [Síntomas depresivos en 65+], [17.6%], [ENSANUT 2018-19],
    [Uso de internet en 65+], [20-25%], [INEGI, ENDUTIH 2022],
    [Tenencia de celular en 60+], [60-65%], [INEGI, ENDUTIH 2022],
  ),
  caption: [Indicadores clave sobre adultos mayores en México],
)

== Panorama global

La Organización Mundial de la Salud declaró el aislamiento social y la soledad como una "amenaza urgente para la salud" y en 2023 lanzó la Comisión sobre Conexión Social. A nivel global, 1 de cada 4 adultos mayores experimenta aislamiento social.

La Comisión Lancet sobre prevención de demencia (2020) identificó el aislamiento social como uno de los 12 factores de riesgo modificables para la demencia, estimando que representa aproximadamente el 4% de los casos globales.

En América Latina, la OPS ha señalado que la soledad en adultos mayores se agrava por la pobreza, la migración de familiares jóvenes y la debilidad de los sistemas de pensiones --- factores especialmente presentes en México.

= Impacto de la soledad en la salud

== Deterioro cognitivo

Un estudio en _JAMA Internal Medicine_ (Wilson et al., 2007) encontró que las personas con mayor nivel de soledad tienen un *64% más de riesgo de desarrollar demencia clínica*. El meta-análisis de Kuiper et al. (2015, _Ageing Research Reviews_) mostró que el aislamiento social acelera el deterioro cognitivo a un ritmo comparable a 1.4-2 años de envejecimiento adicional.

La conversación regular y la interacción social se encuentran entre los factores protectores más fuertes contra el deterioro cognitivo (Fratiglioni et al., 2004, _Lancet Neurology_). El estudio ACTIVE y trabajos relacionados sugieren que la estimulación cognitiva, incluyendo la conversación, puede retrasar el inicio de la demencia entre 1 y 3 años.

== Depresión y salud mental

El aislamiento social es el predictor individual más fuerte de depresión en la vejez, por encima incluso de las limitaciones físicas de salud (Cacioppo et al., 2006, _Current Directions in Psychological Science_). Los datos de ENSANUT muestran que los adultos mayores mexicanos que viven solos o con mínimo contacto social tienen 2-3 veces más probabilidades de presentar síntomas depresivos.

== Mortalidad y salud física

El meta-análisis de Holt-Lunstad et al. (2010, _PLOS Medicine_; 148 estudios, 308,849 participantes) encontró que las relaciones sociales *aumentan la probabilidad de supervivencia en un 50%*. En una revisión posterior (2015), los riesgos específicos fueron:

#figure(
  table(
    columns: 2,
    fill: (_, row) => if row == 0 { rgb("#E3F2FD") } else if calc.odd(row) { rgb("#F5F5F5") },
    table.header(
      [*Factor de riesgo*], [*Aumento en riesgo de mortalidad*],
    ),
    [Aislamiento social], [29%],
    [Soledad percibida], [26%],
    [Vivir solo], [32%],
    [Comparación: fumar 15 cigarros/día], [~26%],
  ),
  caption: [Riesgo de mortalidad asociado a la soledad (Holt-Lunstad et al., 2015)],
)

La soledad crónica también se asocia con un 29% más de riesgo de enfermedad coronaria y un 32% más de riesgo de accidente cerebrovascular (Valtorta et al., 2016, _Heart_), debido a la elevación de cortisol y marcadores inflamatorios.

= Caídas: una emergencia silenciosa

Las caídas son la *principal causa de muerte por lesión* entre adultos de 65 años o más a nivel mundial (OMS, 2007). En México, la ENSANUT 2018 reportó que entre el 30-34% de los adultos de 65+ sufrieron al menos una caída en los últimos 12 meses.

El factor más crítico es el tiempo de respuesta. El fenómeno conocido como "long lie" --- permanecer en el suelo por más de una hora tras una caída --- se asocia con una mortalidad del 50% dentro de los 6 meses siguientes, incluso cuando la caída en sí no fue severa (Fleming & Brayne, 2008, _Age and Ageing_).

Los sistemas de respuesta personal de emergencia (PERS) han demostrado reducir las hospitalizaciones en un 26% y las visitas a urgencias en aproximadamente 10% (estudios AARP/Universidad de Michigan). Un dispositivo con detección automática de caídas elimina la dependencia de que el adulto mayor pueda presionar un botón tras la caída --- un escenario frecuente cuando pierde la conciencia.

= Compañeros virtuales con IA: evidencia de impacto

== Robots sociales y asistentes conversacionales

La investigación sobre compañeros tecnológicos para adultos mayores muestra resultados consistentemente positivos:

- *PARO* (Japón): Robot terapéutico en forma de foca. Múltiples ensayos clínicos aleatorios demostran reducción en puntajes de depresión, agitación y estrés en residencias de ancianos (Wada et al., 2005; Bemelmans et al., 2015, _JAMDA_).

- *ElliQ* (Intuition Robotics, Israel): Compañero de IA proactivo. Un estudio piloto de 2022 con la Oficina del Envejecimiento del Estado de Nueva York encontró que el *95% de los usuarios diarios reportaron una reducción en su soledad* y el 80% reportaron una mejora en su bienestar. Los usuarios interactuaron con ElliQ un promedio de más de 20 veces al día.

- *Asistentes de voz genéricos* (Alexa, Google Home): Estudios en Cedars-Sinai muestran que reducen la soledad percibida en un 30-40% en programas piloto, aunque carecen de las cualidades proactivas y empáticas de compañeros diseñados específicamente.

Una revisión sistemática de Abdi et al. (2018, _International Journal of Medical Informatics_) concluyó que los robots socialmente asistentes mejoran de forma consistente el estado de ánimo, el nivel de participación y la calidad de vida en poblaciones de adultos mayores.

== Adherencia a medicamentos

La OMS estima que la adherencia a medicamentos en adultos mayores con enfermedades crónicas es de solo el 50% en países desarrollados, y probablemente menor en países en desarrollo. En México, la adherencia para medicamentos de hipertensión y diabetes entre adultos mayores se estima entre el 40-60% (_Salud Pública de México_).

Un meta-análisis de Vervloet et al. (2012, _BMC Medical Informatics_) encontró que los recordatorios electrónicos mejoran la adherencia en 10-20 puntos porcentuales. Los recordatorios basados en voz han demostrado ser más efectivos que los basados en texto para poblaciones de adultos mayores (Granger et al., 2015, _Telemedicine and e-Health_).

= La carga del cuidador y la supervisión familiar

== El cuidado informal en México

En México, entre el 80-85% del cuidado de adultos mayores es proporcionado de manera informal por familiares, predominantemente mujeres --- hijas y nueras (Instituto Nacional de Geriatría, INEGI). Se estima que 2.7 millones de mexicanos fungen como cuidadores primarios informales de personas mayores.

El agotamiento del cuidador afecta entre el 40-70% de los cuidadores informales de adultos mayores con condiciones crónicas (Rosas-Carrasco et al., _Salud Pública de México_; _Gaceta Médica de México_).

La migración interna y la urbanización significan que muchos adultos mayores en comunidades rurales tienen hijos trabajando en ciudades o en Estados Unidos. La "generación sándwich" --- adultos de 35-55 años que simultáneamente cuidan padres ancianos e hijos dependientes con apoyo institucional limitado --- es especialmente prevalente en México.

== Beneficios del monitoreo remoto

Estudios de Czaja et al. (2013, _The Gerontologist_) muestran consistentemente que la tecnología de monitoreo remoto *reduce la ansiedad del cuidador entre un 30-50%* cuando tienen acceso a información en tiempo real sobre su familiar mayor.

Mortenson et al. (2015, _BMC Geriatrics_) encontraron que la tecnología de monitoreo remoto redujo las visitas innecesarias de verificación por parte de familiares en aproximadamente un 40% sin reducir la calidad del cuidado. La "tranquilidad" es el beneficio número 1 reportado por cuidadores familiares que usan tecnología de monitoreo, incluso por encima de las mejoras en salud.

= Soluciones existentes y brechas

#figure(
  table(
    columns: 3,
    fill: (_, row) => if row == 0 { rgb("#E3F2FD") } else if calc.odd(row) { rgb("#F5F5F5") },
    table.header(
      [*Solución*], [*Tipo*], [*Limitaciones*],
    ),
    [ElliQ (Israel)], [Robot compañero IA], [No disponible en México; inglés; \$250+ suscripción],
    [PARO (Japón)], [Robot terapéutico], [\~\$5,000 USD; uso institucional; no conversacional],
    [Alexa / Google Home], [Asistente de voz], [Reactivo, no proactivo; no diseñado para mayores],
    [Life Alert y similares], [Detección de emergencias], [Sin compañía; solo botón; limitado en México],
    [IMSS Digital], [Telemedicina], [No es compañía; requiere smartphone],
    [Wearables fitness], [Monitoreo de salud], [Requieren carga, pairing; sin componente social],
  ),
  caption: [Soluciones existentes en el mercado y sus limitaciones],
)

== Análisis de competidores: compañeros IA existentes

El mercado de robots compañeros con IA para adultos mayores alcanzó un valor estimado de 1.25 mil millones de dólares en 2026, con una tasa de crecimiento anual compuesta (CAGR) del 22%, proyectándose a 4.12 mil millones para 2032 (360iResearch, 2026). A pesar de este crecimiento, las soluciones actuales presentan limitaciones significativas para el contexto latinoamericano.

=== Dispositivos y robots dedicados

#figure(
  table(
    columns: 4,
    fill: (_, row) => if row == 0 { rgb("#E3F2FD") } else if calc.odd(row) { rgb("#F5F5F5") },
    table.header(
      [*Producto*], [*Empresa / País*], [*Características*], [*Limitaciones*],
    ),
    [ElliQ], [Intuition Robotics (Israel)], [Robot de mesa proactivo; check-ins diarios; recordatorios de bienestar; conversación con memoria contextual; \~\$250 + suscripción mensual], [Solo inglés; no disponible en LATAM; requiere suscripción continua],
    [PARO], [AIST (Japón)], [Foca terapéutica robótica; responde al tacto; certificada como dispositivo médico para demencia y Alzheimer], [\~\$5,000 USD; uso institucional; no conversacional; sin detección de emergencias],
    [Buddy], [Blue Frog Robotics (Francia)], [Robot móvil con IA emocional y generativa; ruedas; pantalla facial expresiva], [\~\$1,500--2,000 USD; soporte limitado en español; enfocado en mercado europeo],
    [Jibo], [Jibo Inc. (EE.UU.)], [Robot social con pantalla animada; recordatorios de medicamentos y citas], [Descontinuado y relanzado con alcance limitado; solo inglés],
    [Lemmy], [SHINSE Delta Tech], [Robot móvil que se desplaza por la casa; presencia continua], [Producto nuevo; precio y disponibilidad por confirmar; sin soporte en español],
    [Ebo X], [Enabot], [Híbrido entre compañero y cámara de monitoreo móvil; check-ins remotos para familia; \~\$300], [Más monitoreo que compañía; interacción conversacional limitada],
    [Loona], [KEYi Tech], [Robot mascota con IA; interacción lúdica; \~\$400], [Enfoque recreativo, no médico ni de cuidado; sin funciones de emergencia],
  ),
  caption: [Robots y dispositivos compañeros de IA para adultos mayores en el mercado global (2025--2026)],
)

=== Aplicaciones y servicios de software

#figure(
  table(
    columns: 3,
    fill: (_, row) => if row == 0 { rgb("#E3F2FD") } else if calc.odd(row) { rgb("#F5F5F5") },
    table.header(
      [*Producto*], [*Descripción*], [*Limitaciones para adultos mayores*],
    ),
    [Replika], [Chatbot con personalidad persistente y memoria], [Requiere smartphone; no diseñado para adultos mayores; sin funciones de salud],
    [Pi (Inflection AI)], [IA conversacional empática de propósito general], [Solo app/web; sin hardware; sin monitoreo de salud],
    [inTouch], [Llamadas telefónicas con IA para seniors; reduce soledad 20% y depresión 24%], [Solo llamadas; sin detección de caídas ni recordatorios; disponibilidad limitada],
    [Alexa Care Hub], [Modo senior de Amazon Alexa con alertas a familia], [Reactivo (espera comandos); sin compañía proactiva; configuración compleja],
  ),
  caption: [Aplicaciones y servicios de compañía con IA (2025--2026)],
)

=== Caso destacado: ElliQ y el piloto de Nueva York

ElliQ merece atención especial por ser el competidor más directo. En 2022, la Oficina del Envejecimiento del Estado de Nueva York adquirió 800 unidades de ElliQ para adultos mayores que viven solos. Tras un año de uso, el 95% de los participantes reportaron una reducción en sentimientos de soledad, y el 80% reportaron mejoras en su bienestar general. Los usuarios interactuaban con ElliQ un promedio de más de 20 veces al día (NY State Office for the Aging, 2023).

Este caso demuestra que la tecnología funciona --- el problema es que no llega a México ni a Latinoamérica.

== Brechas identificadas

+ *No existe un compañero de IA en español* diseñado específicamente para adultos mayores mexicanos. Todas las soluciones principales son en inglés.

+ *Ninguna solución integra* compañía + recordatorios de salud + detección de caídas + supervisión familiar en un solo dispositivo accesible.

+ *Los asistentes de voz existentes son reactivos* --- esperan comandos. Los adultos mayores con soledad o deterioro cognitivo pueden no iniciar la interacción. Un compañero proactivo que inicia conversación es fundamentalmente diferente.

+ *El contexto cultural importa.* Los adultos mayores mexicanos valoran la plática, la conexión familiar y la calidez. Los asistentes de IA genéricos carecen de calibración cultural.

+ *Accesibilidad económica.* ElliQ (\$250+ suscripción) y PARO (\$5,000) son inaccesibles para la mayoría de las familias mexicanas.

+ *Integración familiar.* La mayoría de las soluciones se enfocan solo en el adulto mayor O en el cuidador, no en ambos.

= Conclusión

La evidencia es clara: la soledad en adultos mayores no es solo un problema emocional --- es un factor de riesgo comparable a fumar que aumenta la mortalidad, acelera el deterioro cognitivo y multiplica las hospitalizaciones. En México, donde 17.9 millones de personas mayores de 60 años enfrentan una brecha digital del 75% y un sistema de cuidado que recae casi exclusivamente en familias ya sobrecargadas, la necesidad de soluciones accesibles y culturalmente relevantes es urgente.

La investigación existente sobre compañeros virtuales con IA demuestra reducciones significativas en soledad, mejoras en bienestar y mejor adherencia a tratamientos. ElliQ redujo la soledad en el 95% de sus usuarios en Nueva York; PARO es un dispositivo médico certificado para demencia; inTouch reduce depresión en un 24% con solo llamadas telefónicas. El mercado crece a un ritmo del 22% anual y se proyecta a más de 4 mil millones de dólares para 2032. Sin embargo, ninguna solución actual combina compañía proactiva en español, recordatorios de salud, detección de caídas y supervisión familiar en un dispositivo accesible que no requiera que el adulto mayor sepa usar tecnología.

Lumi busca ocupar exactamente esa brecha: un compañero de IA que habla español mexicano, que inicia la conversación, que recuerda al usuario y a su familia, y que puede alertar en emergencias --- todo desde un dispositivo físico que solo requiere presionar un botón y hablar.

#pagebreak()

= Referencias

#set text(
  font: "Times New Roman",
  size: 12pt,
)
#set par(
  hanging-indent: 1.27cm,
  leading: 1.5em,
  justify: false,
)

Abdi, J., Al-Hindawi, A., Ng, T., & Vizcaychipi, M. P. (2018). Scoping review on the use of socially assistive robot technology in elderly care 2008-2015. _International Journal of Medical Informatics_, 114, 1-10.

Bemelmans, R., Gelderblom, G. J., Jonker, P., & de Witte, L. (2015). Effectiveness of robot Paro in intramural psychogeriatric care: A multicenter quasi-experimental study. _Journal of the American Medical Directors Association_, 16(11), 946-950.

Cacioppo, J. T., Hughes, M. E., Waite, L. J., Hawkley, L. C., & Thisted, R. A. (2006). Loneliness as a specific risk factor for depressive symptoms. _Current Directions in Psychological Science_, 15(6), 317-323.

CONAPO. (2018). _Proyecciones de la Población de México y de las Entidades Federativas 2016-2050_. Consejo Nacional de Población.

Fleming, J., & Brayne, C. (2008). Inability to get up after falling, subsequent time on floor, and summoning help: Prospective cohort study in people over 90. _Age and Ageing_, 37(4), 467-471.

Fratiglioni, L., Paillard-Borg, S., & Winblad, B. (2004). An active and socially integrated lifestyle in late life might protect against dementia. _The Lancet Neurology_, 3(6), 343-353.

Granger, B. B., Bosworth, H. B., & Voils, C. I. (2015). Electronic adherence reminders: A review of efficacy and acceptability. _Telemedicine and e-Health_, 21(3), 170-179.

Holt-Lunstad, J., Smith, T. B., Baker, M., Harris, T., & Stephenson, D. (2015). Loneliness and social isolation as risk factors for mortality: A meta-analytic review. _Perspectives on Psychological Science_, 10(2), 227-237.

Holt-Lunstad, J., Smith, T. B., & Layton, J. B. (2010). Social relationships and mortality risk: A meta-analytic review. _PLOS Medicine_, 7(7), e1000316.

INEGI. (2020). _Censo de Población y Vivienda 2020_. Instituto Nacional de Estadística y Geografía.

INEGI. (2018). _Encuesta Nacional de la Dinámica Demográfica (ENADID) 2018_. Instituto Nacional de Estadística y Geografía.

INEGI. (2022). _Encuesta Nacional sobre Disponibilidad y Uso de Tecnologías de la Información en los Hogares (ENDUTIH) 2022_. Instituto Nacional de Estadística y Geografía.

Instituto Nacional de Salud Pública. (2018). _Encuesta Nacional de Salud y Nutrición 2018-19 (ENSANUT)_. Secretaría de Salud.

Kuiper, J. S., Zuidersma, M., Oude Voshaar, R. C., Zuidema, S. U., van den Heuvel, E. R., Stolk, R. P., & Smidt, N. (2015). Social relationships and risk of dementia: A systematic review and meta-analysis of longitudinal cohort studies. _Ageing Research Reviews_, 22, 39-57.

Livingston, G., Huntley, J., Sommerlad, A., et al. (2020). Dementia prevention, intervention, and care: 2020 report of the Lancet Commission. _The Lancet_, 396(10248), 413-446.

Mortenson, W. B., Sixsmith, A., & Beringer, R. (2015). No place like home? Surveillance and what home means in old age. _BMC Geriatrics_, 15, 104.

Organización Mundial de la Salud. (2007). _WHO Global Report on Falls Prevention in Older Age_. OMS.

Organización Mundial de la Salud. (2023). _Commission on Social Connection_. OMS.

Rosas-Carrasco, O., Torres-Arreola, L., & Guerra-Silla, M. (2018). Carga del cuidador informal de adultos mayores dependientes en México. _Salud Pública de México_, 60(4), 456-463.

Valtorta, N. K., Kanaan, M., Gilbody, S., Ronzi, S., & Hanratty, B. (2016). Loneliness and social isolation as risk factors for coronary heart disease and stroke. _Heart_, 102(13), 1009-1016.

Vervloet, M., Linn, A. J., van Weert, J. C. M., de Bakker, D. H., Bouvy, M. L., & van Dijk, L. (2012). The effectiveness of interventions using electronic reminders to improve adherence to chronic medication. _BMC Medical Informatics and Decision Making_, 12, 110.

Wada, K., Shibata, T., Saito, T., & Tanie, K. (2005). Effects of robot-assisted activity for elderly people and nurses at a day service center. _Proceedings of the IEEE_, 92(11), 1780-1788.

Wilson, R. S., Krueger, K. R., Arnold, S. E., Schneider, J. A., Kelly, J. F., Barnes, L. L., ... & Bennett, D. A. (2007). Loneliness and risk of Alzheimer disease. _Archives of General Psychiatry_, 64(2), 234-240.

360iResearch. (2026). _AI Elderly Companion Robot Market Size & Share 2026-2032_. Recuperado de https://www.360iresearch.com/library/intelligence/ai-elderly-companion-robot

Blue Frog Robotics. (2025). _Buddy: The Companion Robot Transforming Senior Care with AI_. Recuperado de https://www.bluefrogrobotics.com

Intuition Robotics. (2026). _ElliQ: Companion Robot for Seniors, Older Adults & Aging Loved Ones_. Recuperado de https://elliq.com

KEYi Technology. (2025). _The Ultimate Guide to AI Companion Robots in 2026_. Recuperado de https://us.keyirobot.com/blogs/buying-guide/ai-companion-robots-best-picks-features-and-buying-tips

New York State Office for the Aging. (2023). _ElliQ Proactive Care Companion Initiative_. Recuperado de https://aging.ny.gov/elliq-proactive-care-companion-initiative
