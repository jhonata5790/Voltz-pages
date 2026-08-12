(function initializePortugueseRealmData(global) {
  /* Voltz Education — Reino de Português.
     Segundo reino jogável. A mecânica exclusiva são as Palavras do Mundo:
     escolhas linguísticas corretas recompõem caminhos, sentidos e estruturas. */

  global.VoltzData = global.VoltzData || {};
  global.VoltzData.realms = global.VoltzData.realms || {};

  const enemyTypes = {
    "erro-ortografico": {
      id: "erro-ortografico",
      family: "orthography",
      name: "Rasura Ortográfica",
      role: "Ortografia e uso das palavras",
      icon: "Aa",
      colorA: "#ff7bd5",
      colorB: "#8cf7ff",
      aura: "rgba(255,123,213,0.24)",
      description: "Uma rasura viva que troca letras e palavras parecidas até o sentido começar a desmanchar.",
      maxHp: 110,
      playerDamageOnWrong: 14,
      playerDamageOnTimeout: 6,
      enemyDamageOnCorrect: 25,
      timeLimit: 32,
      xpReward: 48,
      coinReward: 14,
      questions: [
        { tip: "Sessão é um período de atividade; seção é divisão; cessão é ato de ceder.", text: "Complete: 'A ___ de estudos começou às oito horas.'", options: { A: "seção", B: "sessão", C: "cessão", D: "seçãoo" }, answer: "B", explanation: "Sessão designa um período em que uma atividade acontece: sessão de estudos." },
        { tip: "A palavra vem de 'exceto' e mantém o grupo 'xc'.", text: "Qual palavra está escrita corretamente?", options: { A: "excessão", B: "exceção", C: "ecessão", D: "esceção" }, answer: "B", explanation: "A grafia correta é exceção." },
        { tip: "'Traz' é forma do verbo trazer; 'trás' indica posição posterior.", text: "Complete: 'Ele sempre ___ o caderno para a aula.'", options: { A: "trás", B: "traz", C: "tráz", D: "trazs" }, answer: "B", explanation: "Traz é forma do verbo trazer: ele traz o caderno." },
        { tip: "Mas indica oposição; mais indica quantidade ou intensidade.", text: "Complete: 'Eu queria continuar, ___ já estava muito tarde.'", options: { A: "mais", B: "mas", C: "máis", D: "más" }, answer: "B", explanation: "Mas introduz uma oposição entre querer continuar e estar tarde." },
        { tip: "Para tempo decorrido, o verbo haver é usado no singular.", text: "Complete: '___ três meses que comecei o curso.'", options: { A: "A", B: "À", C: "Há", D: "Ah" }, answer: "C", explanation: "Há indica tempo decorrido: há três meses." },
        { tip: "Em perguntas diretas, normalmente usamos 'por que' separado.", text: "Complete: '___ você chegou cedo?'", options: { A: "Porque", B: "Porquê", C: "Por quê", D: "Por que" }, answer: "D", explanation: "Em início de pergunta direta, usa-se por que." },
        { tip: "Em respostas explicativas ou causais, usa-se 'porque'.", text: "Complete: 'Cheguei cedo ___ queria revisar a matéria.'", options: { A: "porque", B: "por que", C: "por quê", D: "porquê" }, answer: "A", explanation: "Porque introduz a explicação ou causa." },
        { tip: "No fim da frase, antes de pontuação, 'quê' recebe acento.", text: "Complete: 'Você saiu mais cedo por ___?'", options: { A: "que", B: "quê", C: "porque", D: "porquê" }, answer: "B", explanation: "A expressão correta no fim da pergunta é por quê." },
        { tip: "Quando significa 'motivo' e vem acompanhado de artigo, é substantivo.", text: "Complete: 'Ninguém explicou o ___ da mudança.'", options: { A: "por que", B: "porque", C: "porquê", D: "por quê" }, answer: "C", explanation: "O porquê é substantivo e significa o motivo." },
        { tip: "Mau é oposto de bom; mal é oposto de bem.", text: "Complete: 'Ele se sentiu ___ depois da prova.'", options: { A: "mal", B: "mau", C: "malz", D: "máu" }, answer: "A", explanation: "Sentir-se mal se opõe a sentir-se bem." },
        { tip: "Aonde é usado com verbos que indicam movimento e pedem a preposição 'a'.", text: "Complete: '___ vocês vão depois da aula?'", options: { A: "Onde", B: "Aonde", C: "Daonde", D: "Há onde" }, answer: "B", explanation: "Ir a algum lugar: aonde vocês vão?" },
        { tip: "O substantivo termina em -gem; 'viajem' é forma verbal.", text: "Complete: 'A ___ foi muito tranquila.'", options: { A: "viajem", B: "viagem", C: "viajém", D: "viagen" }, answer: "B", explanation: "Viagem é o substantivo. Viajem é forma do verbo viajar." },
        { tip: "Conserto é reparo; concerto é apresentação ou composição musical.", text: "Complete: 'O técnico terminou o ___ do computador.'", options: { A: "concerto", B: "conserto", C: "conçerto", D: "consserto" }, answer: "B", explanation: "Conserto significa reparo." },
        { tip: "Descrição é ato de descrever; discrição é reserva ou prudência.", text: "Complete: 'O texto traz uma boa ___ do cenário.'", options: { A: "discrição", B: "descrição", C: "descripção", D: "descrisão" }, answer: "B", explanation: "Descrição é a apresentação de características de algo." },
        { tip: "Acento é sinal gráfico ou destaque de pronúncia; assento é lugar para sentar.", text: "Complete: 'A palavra “você” recebe ___ agudo.'", options: { A: "assento", B: "acento", C: "asento", D: "acênto" }, answer: "B", explanation: "Acento é o sinal gráfico usado na palavra." }
      ]
    },

    "fragmento-sintatico": {
      id: "fragmento-sintatico",
      family: "syntax",
      name: "Fragmento Sintático",
      role: "Sintaxe, concordância e organização",
      icon: "{ }",
      colorA: "#9d78ff",
      colorB: "#ffde7a",
      aura: "rgba(157,120,255,0.24)",
      description: "Uma frase partida que tenta remontar sujeitos, verbos e termos em posições impossíveis.",
      maxHp: 125,
      playerDamageOnWrong: 16,
      playerDamageOnTimeout: 7,
      enemyDamageOnCorrect: 25,
      timeLimit: 31,
      xpReward: 58,
      coinReward: 17,
      questions: [
        { tip: "O verbo concorda com o núcleo plural do sujeito.", text: "Qual frase apresenta concordância adequada?", options: { A: "As meninas chegou cedo.", B: "As meninas chegaram cedo.", C: "As menina chegaram cedo.", D: "As meninas chegamos cedo." }, answer: "B", explanation: "O sujeito 'as meninas' é plural, portanto o verbo deve ser 'chegaram'." },
        { tip: "Quando indica tempo decorrido, 'fazer' é impessoal e fica no singular.", text: "Qual forma está correta?", options: { A: "Faz dois anos que estudo aqui.", B: "Fazem dois anos que estudo aqui.", C: "Fizeram dois anos que estudo aqui.", D: "Faz dois ano que estudo aqui." }, answer: "A", explanation: "O verbo fazer, indicando tempo decorrido, permanece no singular." },
        { tip: "Com sentido de existir, 'haver' é impessoal.", text: "Complete: '___ muitos livros sobre o assunto.'", options: { A: "Haviam", B: "Havia", C: "Houveram", D: "Haviam-se" }, answer: "B", explanation: "Haver com sentido de existir é impessoal: havia muitos livros." },
        { tip: "Sujeito composto normalmente leva o verbo ao plural.", text: "Complete: 'Os alunos e a professora ___ da atividade.'", options: { A: "participou", B: "participaram", C: "participastes", D: "participara" }, answer: "B", explanation: "O sujeito composto 'os alunos e a professora' exige verbo no plural." },
        { tip: "Com artigo definido, a expressão 'é proibido' varia para concordar com o substantivo.", text: "Qual construção está adequada?", options: { A: "É proibido a entrada.", B: "É proibida a entrada.", C: "São proibido a entrada.", D: "É proibidas a entrada." }, answer: "B", explanation: "Com o artigo 'a', o adjetivo concorda: é proibida a entrada." },
        { tip: "'Anexo' é adjetivo e concorda com o substantivo a que se refere.", text: "Complete: 'Seguem ___ os documentos solicitados.'", options: { A: "anexo", B: "anexos", C: "anexa", D: "em anexos" }, answer: "B", explanation: "Documentos está no plural masculino, então: anexos." },
        { tip: "Quando significa 'um pouco', meio é advérbio e não varia.", text: "Complete: 'Ela ficou ___ cansada depois da caminhada.'", options: { A: "meia", B: "meio", C: "meias", D: "meios" }, answer: "B", explanation: "Meio, com sentido de 'um pouco', é advérbio e permanece invariável." },
        { tip: "Quando acompanha um substantivo significando 'muitos', bastante pode variar.", text: "Complete: 'Havia ___ motivos para revisar o projeto.'", options: { A: "bastante", B: "bastantes", C: "bastantemente", D: "bastantas" }, answer: "B", explanation: "Bastantes equivale a 'muitos' e concorda com 'motivos'." },
        { tip: "A forma padrão é sempre 'menos'.", text: "Complete: 'Hoje vieram ___ pessoas à reunião.'", options: { A: "menas", B: "menos", C: "menoses", D: "menos de" }, answer: "B", explanation: "Menos é invariável; 'menas' não pertence à norma-padrão." },
        { tip: "Diferente de 'haver', o verbo existir concorda com o sujeito.", text: "Complete: '___ várias soluções possíveis.'", options: { A: "Existe", B: "Existem", C: "Haviam", D: "Existia-se" }, answer: "B", explanation: "O sujeito 'várias soluções' é plural: existem várias soluções." },
        { tip: "Com verbo transitivo indireto + se, o sujeito é indeterminado e o verbo fica no singular.", text: "Qual frase está adequada?", options: { A: "Precisam-se de voluntários.", B: "Precisa-se de voluntários.", C: "Precisam se de voluntários.", D: "Precisa de-se voluntários." }, answer: "B", explanation: "Em 'precisa-se de voluntários', o se indetermina o sujeito e o verbo fica no singular." },
        { tip: "Com verbo transitivo direto + se apassivador, o verbo concorda com o sujeito paciente.", text: "Qual frase está adequada?", options: { A: "Vende-se casas.", B: "Vendem-se casas.", C: "Vende-se casa e apartamentos.", D: "Vendem casa-se." }, answer: "B", explanation: "Casas é sujeito paciente plural: vendem-se casas." },
        { tip: "Palavras negativas atraem o pronome para antes do verbo.", text: "Qual frase segue a colocação pronominal padrão?", options: { A: "Não diga-me isso.", B: "Não me diga isso.", C: "Não diga isso-me.", D: "Me não diga isso." }, answer: "B", explanation: "A palavra negativa 'não' favorece próclise: não me diga." },
        { tip: "O vocativo deve ser isolado por vírgula.", text: "Qual pontuação está correta?", options: { A: "João venha aqui.", B: "João, venha aqui.", C: "João venha, aqui.", D: "João; venha, aqui." }, answer: "B", explanation: "João é vocativo e deve ser separado por vírgula." },
        { tip: "O sujeito simples é 'o grupo', cujo núcleo está no singular.", text: "Complete: 'O grupo de estudantes ___ o projeto.'", options: { A: "apresentaram", B: "apresentou", C: "apresentaste", D: "apresentamos" }, answer: "B", explanation: "O núcleo do sujeito é 'grupo', singular: apresentou." }
      ]
    },

    "eco-semantico": {
      id: "eco-semantico",
      family: "semantics",
      name: "Eco Semântico",
      role: "Sentido e interpretação",
      icon: "…?",
      colorA: "#5de2c2",
      colorB: "#ff91c8",
      aura: "rgba(93,226,194,0.23)",
      description: "Um eco que repete palavras corretas em sentidos errados, confundindo contexto, inferência e intenção.",
      maxHp: 120,
      playerDamageOnWrong: 16,
      playerDamageOnTimeout: 7,
      enemyDamageOnCorrect: 24,
      timeLimit: 34,
      xpReward: 60,
      coinReward: 18,
      questions: [
        { tip: "Procure uma palavra que introduza contraste entre duas ideias.", text: "Complete: 'O exercício era difícil; ___, a turma não desistiu.'", options: { A: "portanto", B: "contudo", C: "porque", D: "logo" }, answer: "B", explanation: "Contudo estabelece contraste: era difícil, mas a turma não desistiu." },
        { tip: "Sinônimo é uma palavra de sentido semelhante.", text: "Qual palavra é sinônimo de 'rápido' nesse contexto?", options: { A: "veloz", B: "lento", C: "pesado", D: "quieto" }, answer: "A", explanation: "Veloz pode ter sentido equivalente a rápido." },
        { tip: "Antônimo expressa sentido oposto.", text: "Qual palavra é antônimo de 'generoso'?", options: { A: "solidário", B: "bondoso", C: "egoísta", D: "gentil" }, answer: "C", explanation: "Egoísta se opõe ao comportamento generoso." },
        { tip: "Pergunte: quem está usando o telescópio? A frase permite mais de uma leitura.", text: "Por que 'Vi o homem com o telescópio' pode ser ambígua?", options: { A: "Porque não há verbo.", B: "Porque não se sabe se eu ou o homem estava com o telescópio.", C: "Porque telescópio é plural.", D: "Porque a frase não tem sujeito." }, answer: "B", explanation: "O termo 'com o telescópio' pode ligar-se a 'vi' ou a 'o homem'." },
        { tip: "Inferir é concluir algo que o texto sugere, mesmo sem dizer diretamente.", text: "Texto: 'Marina entrou encharcada e deixou o guarda-chuva aberto na varanda.' O que podemos inferir?", options: { A: "Estava nevando.", B: "Provavelmente estava chovendo.", C: "Marina foi nadar.", D: "O guarda-chuva estava quebrado." }, answer: "B", explanation: "Os indícios 'encharcada' e 'guarda-chuva' permitem inferir chuva." },
        { tip: "A expressão não fala literalmente de um órgão feito de pedra.", text: "Na frase 'Ele tem coração de pedra', qual é o sentido mais provável?", options: { A: "Ele tem uma doença cardíaca.", B: "Ele é insensível ou pouco compassivo.", C: "Ele coleciona pedras.", D: "Ele é muito forte fisicamente." }, answer: "B", explanation: "É uma expressão conotativa que sugere insensibilidade." },
        { tip: "Sentido literal corresponde ao significado direto das palavras.", text: "Qual frase usa 'frio' em sentido literal?", options: { A: "Ele deu uma resposta fria.", B: "A noite estava fria.", C: "O olhar dela congelou a sala.", D: "A recepção foi gelada." }, answer: "B", explanation: "Na noite estava fria, a palavra indica temperatura de modo literal." },
        { tip: "Observe o substantivo mais próximo e o sentido do período.", text: "Texto: 'Clara entregou o livro a Sofia porque ela precisava estudar.' O pronome 'ela' é potencialmente problemático por quê?", options: { A: "Não é pronome.", B: "Pode retomar Clara ou Sofia.", C: "Está no plural.", D: "Não existe antecedente." }, answer: "B", explanation: "O pronome pode referir-se a duas pessoas, gerando ambiguidade." },
        { tip: "A segunda oração apresenta uma conclusão derivada da primeira.", text: "Complete: 'Todos os dados foram conferidos; ___, podemos publicar o relatório.'", options: { A: "portanto", B: "embora", C: "porque", D: "contudo" }, answer: "A", explanation: "Portanto introduz uma conclusão." },
        { tip: "A segunda oração explica a causa da primeira.", text: "Complete: 'A aula foi adiada ___ faltou energia.'", options: { A: "portanto", B: "porque", C: "entretanto", D: "para que" }, answer: "B", explanation: "Porque introduz a causa do adiamento." },
        { tip: "'Para que' costuma indicar finalidade.", text: "Complete: 'Organizei as anotações ___ todos pudessem revisar.'", options: { A: "embora", B: "portanto", C: "para que", D: "contudo" }, answer: "C", explanation: "Para que introduz a finalidade da organização das anotações." },
        { tip: "Ironia acontece quando o sentido pretendido contrasta com o sentido literal.", text: "Depois de perder o ônibus, alguém diz: 'Que ótimo, era exatamente o que faltava!' O efeito é de:", options: { A: "elogio literal", B: "ironia", C: "descrição científica", D: "ordem" }, answer: "B", explanation: "A pessoa diz 'ótimo' para expressar justamente o contrário." },
        { tip: "Uma mesma palavra pode assumir sentidos diferentes conforme o contexto.", text: "Em 'sentei no banco' e 'fui ao banco sacar dinheiro', a palavra 'banco' exemplifica:", options: { A: "polissemia", B: "antônimo", C: "rima", D: "concordância" }, answer: "A", explanation: "Banco possui sentidos diferentes conforme o contexto, caso de polissemia." },
        { tip: "Conotação acrescenta sentido figurado ou associado.", text: "Qual expressão é claramente conotativa?", options: { A: "A porta está aberta.", B: "O copo caiu no chão.", C: "Aquela notícia foi um balde de água fria.", D: "O livro tem 200 páginas." }, answer: "C", explanation: "'Balde de água fria' é usado figuradamente para indicar frustração ou desânimo." },
        { tip: "Um bom título sintetiza a ideia central, não um detalhe isolado.", text: "Texto: 'A escola criou uma horta; alunos passaram a cuidar das plantas e estudar alimentação sustentável.' Qual título é mais adequado?", options: { A: "Uma prova difícil", B: "Horta escolar une prática e sustentabilidade", C: "Como consertar computadores", D: "O fim das aulas" }, answer: "B", explanation: "O título resume a ação principal e seu objetivo educativo." }
      ]
    },

    "mini-chefe-ortcepse": {
      id: "mini-chefe-ortcepse",
      name: "Ortcepse",
      role: "Mini-chefe da Linguagem Invertida",
      icon: "?A",
      colorA: "#6f6b7c",
      colorB: "#f0e7ff",
      aura: "rgba(111,107,124,0.28)",
      battleImage: "assets/images/mini-bosses/ortcepse.webp",
      battleImageSize: "miniBoss",
      description: "O Espectro ao contrário: uma massa de letras, símbolos e sentidos invertidos que sobrevive de frases quebradas.",
      maxHp: 300,
      playerDamageOnWrong: 20,
      playerDamageOnTimeout: 9,
      enemyDamageOnCorrect: 40,
      timeLimit: 28,
      xpReward: 170,
      coinReward: 55,
      questions: [
        { tip: "Leia a frase inteira antes de escolher a palavra.", text: "Qual opção completa corretamente: 'Não sei ___ ele não veio.'", options: { A: "porque", B: "por que", C: "porquê", D: "por quê" }, answer: "B", explanation: "Em pergunta indireta, usa-se por que: não sei por que ele não veio." },
        { tip: "O verbo haver, com sentido de existir, permanece no singular.", text: "Qual frase está correta?", options: { A: "Haviam dúvidas no texto.", B: "Havia dúvidas no texto.", C: "Houveram dúvidas no texto.", D: "Haviam-se dúvidas no texto." }, answer: "B", explanation: "Haver com sentido de existir é impessoal: havia dúvidas." },
        { tip: "Procure o conectivo que cria oposição.", text: "'O argumento parece simples; ___, exige leitura cuidadosa.'", options: { A: "portanto", B: "entretanto", C: "porque", D: "logo" }, answer: "B", explanation: "Entretanto introduz contraste." },
        { tip: "Use o contexto para distinguir palavras de som parecido.", text: "Complete: 'O músico fará um ___ amanhã.'", options: { A: "conserto", B: "concerto", C: "consserto", D: "conçerto" }, answer: "B", explanation: "Concerto é uma apresentação musical." },
        { tip: "O vocativo deve ser isolado.", text: "Qual frase está pontuada adequadamente?", options: { A: "Alunos abram o livro.", B: "Alunos, abram o livro.", C: "Alunos abram, o livro.", D: "Alunos; abram, o livro." }, answer: "B", explanation: "Alunos é vocativo e deve ser isolado por vírgula." },
        { tip: "A ambiguidade nasce quando um termo pode se ligar a mais de uma parte.", text: "Qual frase é mais ambígua?", options: { A: "O sol nasceu às seis.", B: "Pedro encontrou Lucas com seu irmão.", C: "A menina leu o livro inteiro.", D: "A porta estava fechada." }, answer: "B", explanation: "'Seu irmão' pode referir-se a Pedro ou Lucas, dependendo do contexto." },
        { tip: "Mau se opõe a bom.", text: "Complete: 'Foi um ___ conselho.'", options: { A: "mal", B: "mau", C: "máu", D: "maus" }, answer: "B", explanation: "Mau é adjetivo e se opõe a bom: um mau conselho." },
        { tip: "O núcleo do sujeito é singular.", text: "Complete: 'A maioria dos participantes ___ cedo.'", options: { A: "chegou", B: "chegaram obrigatoriamente", C: "chegastes", D: "chegamos" }, answer: "A", explanation: "Com o núcleo singular 'maioria', a concordância singular é plenamente adequada: chegou." },
        { tip: "Procure uma conclusão lógica.", text: "'O prazo terminou; ___, novas inscrições não serão aceitas.'", options: { A: "portanto", B: "embora", C: "contudo", D: "porque" }, answer: "A", explanation: "Portanto introduz a consequência/conclusão." },
        { tip: "O pronome precisa ter um referente claro.", text: "Qual reescrita elimina a ambiguidade de 'Ana falou com Bia quando ela saiu'?", options: { A: "Ana falou com Bia quando saiu.", B: "Quando Bia saiu, Ana falou com ela.", C: "Ela falou quando ela saiu.", D: "Ana e Bia ela saiu." }, answer: "B", explanation: "A reescrita identifica Bia como quem saiu e evita referente duvidoso." },
        { tip: "A palavra que significa reparo usa S.", text: "Qual opção completa: 'O celular voltou do ___'?", options: { A: "concerto", B: "conserto", C: "conçerto", D: "consserto" }, answer: "B", explanation: "Conserto significa reparo." },
        { tip: "Existir concorda com o sujeito plural.", text: "Complete: '___ argumentos melhores para essa interpretação.'", options: { A: "Existe", B: "Existem", C: "Haviam", D: "Existe-se" }, answer: "B", explanation: "Argumentos é plural: existem argumentos." },
        { tip: "A expressão é figurada.", text: "Em 'a notícia caiu como uma bomba', a comparação indica que a notícia foi:", options: { A: "silenciosa", B: "impactante", C: "sem importância", D: "literalmente explosiva" }, answer: "B", explanation: "A expressão destaca o forte impacto causado pela notícia." },
        { tip: "No fim de uma pergunta, a expressão recebe acento.", text: "Complete: 'Você mudou a frase por ___?'", options: { A: "que", B: "quê", C: "porque", D: "porquê" }, answer: "B", explanation: "No fim da pergunta, usa-se por quê." },
        { tip: "Leia o conjunto: coerência é relação lógica entre as ideias.", text: "Qual sequência é mais coerente?", options: { A: "Choveu muito. Por isso, levei um guarda-chuva.", B: "Choveu muito. Por isso, o deserto ficou mais seco.", C: "Estudei bastante. Entretanto, portanto, porque.", D: "Acordei cedo. Logo, ontem é azul." }, answer: "A", explanation: "A segunda oração decorre logicamente da primeira." }
      ]
    },

    "chefe-espectro-gramatica": {
      id: "chefe-espectro-gramatica",
      name: "Espectro da Gramática",
      role: "Entidade Final de Português",
      icon: "§",
      colorA: "#b85cff",
      colorB: "#ff7bd5",
      aura: "rgba(184,92,255,0.31)",
      battleImage: "assets/images/bosses/espectro-da-gramatica.webp",
      battleImageSize: "boss",
      description: "A forma completa da linguagem corrompida: regras, sentidos e estruturas giram dentro dele como páginas arrancadas de um livro vivo.",
      maxHp: 300,
      playerDamageOnWrong: 23,
      playerDamageOnTimeout: 10,
      enemyDamageOnCorrect: 52,
      timeLimit: 27,
      xpReward: 320,
      coinReward: 110,
      victoryDiploma: {
        id: "diploma-portugues",
        realmId: "reino-gramatica",
        name: "Diploma de Português",
        abilityId: "leitura-critica",
        abilityName: "Leitura Crítica",
        abilityDescription: "Uma vez por batalha, destaca uma alternativa incorreta como semanticamente incoerente, sem removê-la."
      },
      victoryRealmLabel: "Reino de Português",
      questions: [
        { tip: "A ideia de oposição deve permanecer clara.", text: "Qual reescrita mantém o sentido de 'Embora estivesse cansada, Lia continuou estudando'?", options: { A: "Lia continuou estudando porque estava descansada.", B: "Mesmo cansada, Lia continuou estudando.", C: "Lia parou de estudar, pois estava cansada.", D: "Lia estudou para ficar cansada." }, answer: "B", explanation: "'Mesmo cansada' preserva a relação concessiva expressa por 'embora'." },
        { tip: "O verbo haver é impessoal quando significa existir.", text: "Qual frase está de acordo com a norma-padrão?", options: { A: "Haviam muitos erros no rascunho.", B: "Havia muitos erros no rascunho.", C: "Houveram muitos erros no rascunho.", D: "Haviam existido erro." }, answer: "B", explanation: "Haver com sentido de existir fica no singular: havia." },
        { tip: "Observe se a oração explica causa ou consequência.", text: "Complete: 'O texto foi revisado várias vezes; ___, poucos erros permaneceram.'", options: { A: "por isso", B: "embora", C: "porque", D: "para que" }, answer: "A", explanation: "Por isso expressa consequência do fato de o texto ter sido revisado." },
        { tip: "A expressão substantivada vem acompanhada de artigo.", text: "Complete: 'Ainda não entendi o ___ de tanta confusão.'", options: { A: "porque", B: "por que", C: "por quê", D: "porquê" }, answer: "D", explanation: "O porquê é substantivo e significa motivo." },
        { tip: "O termo destacado pode retomar duas pessoas diferentes.", text: "Qual frase precisa de contexto para saber a quem 'seu' se refere?", options: { A: "Marcos pegou seu caderno.", B: "Marcos devolveu a Paulo seu caderno.", C: "O caderno caiu no chão.", D: "Paulo estudou sozinho." }, answer: "B", explanation: "'Seu caderno' pode ser de Marcos ou Paulo, criando ambiguidade." },
        { tip: "O plural do sujeito exige o plural do verbo existir.", text: "Complete: 'No capítulo final ___ duas interpretações possíveis.'", options: { A: "existe", B: "existem", C: "há-se", D: "houveram" }, answer: "B", explanation: "Existir concorda com 'duas interpretações': existem." },
        { tip: "A linguagem conotativa cria um sentido figurado.", text: "Em 'as palavras abriram uma janela para o passado', 'abriram uma janela' sugere:", options: { A: "quebrar uma parede", B: "permitir acesso imaginativo ou compreensão do passado", C: "instalar uma janela física", D: "fechar um livro" }, answer: "B", explanation: "A expressão é metafórica e indica acesso à compreensão ou imaginação." },
        { tip: "'Aonde' pressupõe movimento em direção a um lugar.", text: "Qual frase está correta?", options: { A: "Aonde fica a biblioteca?", B: "Onde você vai depois da aula?", C: "Aonde você vai depois da aula?", D: "Há onde você vai?" }, answer: "C", explanation: "O verbo ir indica movimento e admite 'aonde'. Para localização, usa-se 'onde'." },
        { tip: "O trecho destacado é um vocativo.", text: "Qual opção apresenta pontuação adequada?", options: { A: "Por favor alunos leiam o trecho.", B: "Por favor, alunos, leiam o trecho.", C: "Por favor alunos, leiam, o trecho.", D: "Por favor; alunos leiam o trecho." }, answer: "B", explanation: "O vocativo 'alunos' deve ser isolado por vírgulas; a expressão inicial também admite separação." },
        { tip: "Procure a tese central, não apenas uma informação secundária.", text: "Texto: 'Ler ficção amplia o contato com perspectivas diferentes e pode estimular empatia.' Qual é a ideia principal?", options: { A: "Ficção serve apenas para entretenimento.", B: "A leitura de ficção pode favorecer contato com outras perspectivas e empatia.", C: "Toda ficção é autobiográfica.", D: "Empatia impede a leitura." }, answer: "B", explanation: "A alternativa B sintetiza diretamente a tese do texto." },
        { tip: "Mal se opõe a bem; mau se opõe a bom.", text: "Qual frase está correta?", options: { A: "O personagem agiu mau.", B: "O personagem agiu mal.", C: "O personagem é um mal aluno, no sentido de ruim.", D: "Ele teve um mal comportamento, obrigatoriamente." }, answer: "B", explanation: "Agir mal se opõe a agir bem. Para 'aluno ruim', o usual é mau aluno." },
        { tip: "A conclusão deve decorrer das informações anteriores.", text: "'A pesquisa ouviu apenas dez pessoas de uma cidade com milhões de habitantes.' Qual crítica é mais adequada?", options: { A: "A amostra pode ser pequena demais para generalizações amplas.", B: "Dez pessoas representam necessariamente toda a cidade.", C: "A pesquisa não possui palavras.", D: "Toda pesquisa pequena é falsa." }, answer: "A", explanation: "Uma amostra muito pequena limita a segurança de generalizações sobre uma população enorme." },
        { tip: "Quando 'meio' significa 'um pouco', funciona como advérbio.", text: "Complete: 'As alunas ficaram ___ preocupadas com o prazo.'", options: { A: "meias", B: "meio", C: "meios", D: "meia" }, answer: "B", explanation: "Meio, significando 'um pouco', não varia: meio preocupadas." },
        { tip: "Leia o contexto para escolher a palavra homófona correta.", text: "Complete: 'A ___ dos direitos autorais foi registrada em contrato.'", options: { A: "sessão", B: "seção", C: "cessão", D: "seção" }, answer: "C", explanation: "Cessão é o ato de ceder ou transferir um direito." },
        { tip: "Coesão liga partes do texto; coerência mantém relação lógica entre ideias.", text: "Qual alternativa descreve melhor um texto coerente?", options: { A: "Um texto em que as ideias se relacionam de forma compreensível e não se contradizem sem propósito.", B: "Um texto que usa apenas frases longas.", C: "Um texto sem conectivos e sem sentido.", D: "Um texto que repete a mesma palavra em todas as linhas." }, answer: "A", explanation: "Coerência diz respeito à construção global de sentido e à relação lógica entre as ideias." }
      ]
    }
  };

  function withPatrol(enemy) {
    return {
      ...enemy,
      originX: enemy.x,
      originY: enemy.y,
      lastX: enemy.x,
      lastY: enemy.y,
      direction: "baixo"
    };
  }

  const commonEnemies = [
    { id: "ortografia-01", typeId: "erro-ortografico", x: 1700, y: 2520, patrol: "horizontal", rangeX: 150, rangeY: 34, speed: 0.0012, phase: 0.2 },
    { id: "ortografia-02", typeId: "erro-ortografico", x: 2500, y: 2640, patrol: "circle", rangeX: 118, rangeY: 72, speed: 0.00116, phase: 1.7 },
    { id: "ortografia-03", typeId: "erro-ortografico", x: 3300, y: 2520, patrol: "horizontal", rangeX: 150, rangeY: 34, speed: 0.00108, phase: 2.8 },

    { id: "semantica-01", typeId: "eco-semantico", x: 560, y: 1660, patrol: "circle", rangeX: 112, rangeY: 76, speed: 0.00122, phase: 0.5 },
    { id: "semantica-02", typeId: "eco-semantico", x: 1080, y: 1940, patrol: "horizontal", rangeX: 158, rangeY: 34, speed: 0.00103, phase: 1.8 },
    { id: "semantica-03", typeId: "eco-semantico", x: 1600, y: 1540, patrol: "circle", rangeX: 108, rangeY: 78, speed: 0.0012, phase: 2.5 },

    { id: "sintaxe-01", typeId: "fragmento-sintatico", x: 3500, y: 1760, patrol: "horizontal", rangeX: 160, rangeY: 38, speed: 0.00108, phase: 0.8 },
    { id: "sintaxe-02", typeId: "fragmento-sintatico", x: 4020, y: 1950, patrol: "circle", rangeX: 126, rangeY: 82, speed: 0.00114, phase: 2.0 },
    { id: "sintaxe-03", typeId: "fragmento-sintatico", x: 4480, y: 1600, patrol: "vertical", rangeX: 34, rangeY: 140, speed: 0.00118, phase: 3.1 }
  ].map(withPatrol);

  const miniBoss = withPatrol({
    id: "mini-chefe-ortcepse",
    typeId: "mini-chefe-ortcepse",
    x: 2500,
    y: 1010,
    patrol: "circle",
    rangeX: 145,
    rangeY: 84,
    speed: 0.001,
    phase: 0.4,
    enemyRank: "miniBoss"
  });

  const boss = withPatrol({
    id: "chefe-espectro-gramatica",
    typeId: "chefe-espectro-gramatica",
    x: 2500,
    y: 390,
    patrol: "vertical",
    rangeX: 0,
    rangeY: 44,
    speed: 0.00084,
    phase: 1.3,
    enemyRank: "boss"
  });

  const worldEquations = [
    {
      id: "palavra-ortografia-01",
      name: "Inscrição da Passagem",
      area: "Bairro Ortográfico",
      x: 2500,
      y: 2390,
      interactionRange: 145,
      formula: "A ___ de estudos começou às oito.",
      prompt: "Escolha a palavra que recompõe a frase e abre a Passagem do Sentido.",
      options: ["seção", "sessão", "cessão", "sesão"],
      answer: "sessão",
      explanation: "Sessão indica um período de atividade. A inscrição recuperou o sentido e a passagem voltou a existir."
    },
    {
      id: "palavra-semantica-01",
      name: "Jardim das Conexões",
      area: "Jardim da Semântica",
      x: 1260,
      y: 1760,
      interactionRange: 145,
      formula: "O desafio era difícil; ___, ninguém desistiu.",
      prompt: "Qual conectivo preserva a relação de contraste entre as ideias?",
      options: ["contudo", "portanto", "porque", "logo"],
      answer: "contudo",
      explanation: "Contudo introduz oposição. As trilhas do Jardim da Semântica voltaram a se conectar."
    },
    {
      id: "palavra-sintaxe-01",
      name: "Mural da Concordância",
      area: "Distrito Sintático",
      x: 3740,
      y: 1760,
      interactionRange: 145,
      formula: "As palavras do mural ___ embaralhadas.",
      prompt: "Escolha a forma verbal que concorda com o sujeito.",
      options: ["estava", "estavam", "esteve", "estaria"],
      answer: "estavam",
      explanation: "O sujeito 'as palavras' está no plural, então a forma adequada é 'estavam'. O distrito recuperou sua estrutura."
    }
  ];

  const progression = {
    openingChallengeId: "palavra-ortografia-01",
    bridgeEquationId: "palavra-ortografia-01",
    commonEnemiesRequiredForMiniBoss: 6,
    requiredEquationIdsForMiniBoss: worldEquations.map((item) => item.id),
    requireMiniBossForBoss: true
  };

  const scene = {
    id: "reino-gramatica",
    name: "Reino de Português",
    className: "scene-portuguese",
    plazaLabel: "PRAÇA DA<br>PALAVRA",
    defaultHint: "Reino de Português: reconstrua palavras, sentidos e frases para impedir que a linguagem se desfaça.",
    spawn: { x: 2500, y: 2960 },
    cameraZoom: 1,
    playerScale: 1,
    zoneMarkers: [],
    buildings: [
      { id: "arquivo-vocabulario", label: "Arquivo do Vocabulário", x: 650, y: 2410, w: 520, h: 300, roofH: 138 },
      { id: "casa-ortografia", label: "Casa da Ortografia", x: 3830, y: 2410, w: 520, h: 300, roofH: 138 },
      { id: "jardim-semantico-arco", label: "Pavilhão dos Sentidos", x: 280, y: 1450, w: 430, h: 290, roofH: 132 },
      { id: "torre-sintatica", label: "Torre Sintática", x: 4290, y: 1450, w: 430, h: 290, roofH: 132 },
      { id: "arquivo-invertido-oeste", label: "Arquivo Invertido", x: 1580, y: 865, w: 420, h: 245, roofH: 112, solid: false },
      { id: "arquivo-invertido-leste", label: "Galeria das Rasuras", x: 3000, y: 865, w: 420, h: 245, roofH: 112, solid: false },
      { id: "catedral-gramatica", label: "Catedral da Gramática", x: 1875, y: 70, w: 1250, h: 470, roofH: 160, solid: false }
    ],
    decorObjects: [
      { id: "praca-palavra-floor", label: "Praça da Palavra", type: "language-plaza", operation: "palavra", x: 1880, y: 2760, w: 1240, h: 390, solid: false, showLabel: false },
      { id: "zona-ortografia-floor", label: "Bairro Ortográfico", type: "language-zone", operation: "ortografia", x: 1120, y: 2310, w: 2760, h: 560, solid: false, showLabel: false },
      { id: "zona-semantica-floor", label: "Jardim da Semântica", type: "language-zone", operation: "semantica", x: 220, y: 1370, w: 1880, h: 760, solid: false, showLabel: false },
      { id: "zona-sintaxe-floor", label: "Distrito Sintático", type: "language-zone", operation: "sintaxe", x: 2900, y: 1370, w: 1880, h: 760, solid: false, showLabel: false },
      { id: "zona-ortcepse-floor", label: "Arquivo Invertido", type: "language-corruption-zone", operation: "ortcepse", x: 1590, y: 760, w: 1820, h: 620, solid: false, showLabel: false },
      { id: "zona-espectro-floor", label: "Catedral da Gramática", type: "language-sanctum", operation: "espectro", x: 1700, y: 90, w: 1600, h: 610, solid: false, showLabel: false },

      { id: "titulo-praca-port", label: "✦  PRAÇA DA PALAVRA", type: "zone-title", operation: "palavra", x: 2260, y: 3070, w: 480, h: 46, solid: false, showLabel: true },
      { id: "titulo-ortografia", label: "Aa  BAIRRO ORTOGRÁFICO", type: "zone-title", operation: "ortografia", x: 2240, y: 2740, w: 520, h: 46, solid: false, showLabel: true },
      { id: "titulo-semantica", label: "…  JARDIM DA SEMÂNTICA", type: "zone-title", operation: "semantica", x: 720, y: 2100, w: 520, h: 46, solid: false, showLabel: true },
      { id: "titulo-sintaxe", label: "{ }  DISTRITO SINTÁTICO", type: "zone-title", operation: "sintaxe", x: 3760, y: 2100, w: 500, h: 46, solid: false, showLabel: true },
      { id: "titulo-ortcepse", label: "¿  ARQUIVO INVERTIDO", type: "zone-title", operation: "ortcepse", x: 2280, y: 1290, w: 440, h: 46, solid: false, showLabel: true },
      { id: "titulo-espectro", label: "§  CATEDRAL DA GRAMÁTICA", type: "zone-title", operation: "espectro", x: 2260, y: 635, w: 480, h: 46, solid: false, showLabel: true },

      { id: "rasgo-sentido-oeste", label: "Rasgo de Sentido", type: "language-rift", x: 0, y: 2180, w: 2340, h: 116, solid: true, showLabel: false },
      { id: "rasgo-sentido-leste", label: "Rasgo de Sentido", type: "language-rift", x: 2660, y: 2180, w: 2340, h: 116, solid: true, showLabel: false },
      { id: "passagem-sentido", label: "Passagem do Sentido", type: "word-gate", operation: "ortografia", x: 2340, y: 2180, w: 320, h: 116, solid: true, showLabel: false, progressGate: { type: "world-equation", equationId: "palavra-ortografia-01" } },

      { id: "rasura-ortcepse-oeste", label: "Rasura de Ortcepse", type: "language-corruption-wall", operation: "ortcepse", x: 0, y: 1320, w: 2340, h: 94, solid: true, showLabel: false },
      { id: "rasura-ortcepse-leste", label: "Rasura de Ortcepse", type: "language-corruption-wall", operation: "ortcepse", x: 2660, y: 1320, w: 2340, h: 94, solid: true, showLabel: false },
      { id: "portao-ortcepse", label: "Selo do Arquivo Invertido", type: "gate", operation: "ortcepse", x: 2340, y: 1320, w: 320, h: 94, solid: true, showLabel: false, progressGate: { type: "mini-boss-unlocked" } },

      { id: "muralha-espectro-oeste", label: "Muralha da Gramática", type: "language-sanctum-wall", operation: "espectro", x: 0, y: 690, w: 2340, h: 86, solid: true, showLabel: false },
      { id: "muralha-espectro-leste", label: "Muralha da Gramática", type: "language-sanctum-wall", operation: "espectro", x: 2660, y: 690, w: 2340, h: 86, solid: true, showLabel: false },
      { id: "portao-espectro", label: "Portal da Gramática", type: "gate", operation: "espectro", x: 2340, y: 690, w: 320, h: 86, solid: true, showLabel: false, progressGate: { type: "boss-unlocked" } },

      { id: "arena-ortografia", label: "Ortografia", type: "language-pad", operation: "ortografia", x: 1550, y: 2390, w: 1900, h: 330, solid: false, showLabel: false },
      { id: "mural-letras", label: "SESSÃO • EXCEÇÃO • PORQUÊ", type: "language-inscription", operation: "ortografia", x: 2160, y: 2395, w: 680, h: 54, solid: false, showLabel: true },
      { id: "marco-letra-01", label: "A", type: "letter-pillar", operation: "ortografia", x: 1420, y: 2490, w: 62, h: 112, solid: true, showLabel: false },
      { id: "marco-letra-02", label: "Ç", type: "letter-pillar", operation: "ortografia", x: 3518, y: 2490, w: 62, h: 112, solid: true, showLabel: false },

      { id: "arena-semantica", label: "Semântica", type: "language-pad", operation: "semantica", x: 260, y: 1530, w: 1500, h: 500, solid: false, showLabel: false },
      { id: "sentido-01", label: "literal ↔ figurado", type: "language-inscription", operation: "semantica", x: 720, y: 1510, w: 480, h: 50, solid: false, showLabel: true },
      { id: "palavra-flutuante-01", label: "contexto", type: "word-crystal", operation: "semantica", x: 330, y: 1690, w: 90, h: 94, solid: true, showLabel: false },
      { id: "palavra-flutuante-02", label: "sentido", type: "word-crystal", operation: "semantica", x: 1660, y: 1665, w: 90, h: 108, solid: true, showLabel: false },

      { id: "arena-sintaxe", label: "Sintaxe", type: "language-pad", operation: "sintaxe", x: 3240, y: 1530, w: 1500, h: 500, solid: false, showLabel: false },
      { id: "estrutura-01", label: "SUJEITO → VERBO → COMPLEMENTO", type: "language-inscription", operation: "sintaxe", x: 3620, y: 1510, w: 760, h: 50, solid: false, showLabel: true },
      { id: "pilar-sintaxe-01", label: "S", type: "syntax-pillar", operation: "sintaxe", x: 3290, y: 1640, w: 76, h: 116, solid: true, showLabel: false },
      { id: "pilar-sintaxe-02", label: "V", type: "syntax-pillar", operation: "sintaxe", x: 4560, y: 1640, w: 76, h: 116, solid: true, showLabel: false },

      { id: "arena-ortcepse", label: "Arena da Palavra Invertida", type: "language-boss-pad", operation: "ortcepse", x: 2050, y: 900, w: 900, h: 350, solid: false, showLabel: false },
      { id: "erro-port-01", label: "OTRAC", type: "corrupt-word", operation: "ortcepse", x: 1740, y: 1040, w: 220, h: 58, solid: false, showLabel: true },
      { id: "erro-port-02", label: "?ODITNES", type: "corrupt-word", operation: "ortcepse", x: 3040, y: 1040, w: 220, h: 58, solid: false, showLabel: true },
      { id: "erro-port-03", label: "A…?…Z", type: "corrupt-word", operation: "ortcepse", x: 2390, y: 820, w: 220, h: 58, solid: false, showLabel: true },

      { id: "santuario-espectro", label: "Nave da Gramática", type: "language-boss-pad", operation: "espectro", x: 2070, y: 250, w: 860, h: 350, solid: false, showLabel: false },
      { id: "coluna-espectro-01", label: "COESÃO", type: "letter-pillar", operation: "espectro", x: 1940, y: 350, w: 80, h: 126, solid: true, showLabel: false },
      { id: "coluna-espectro-02", label: "COERÊNCIA", type: "letter-pillar", operation: "espectro", x: 2980, y: 350, w: 80, h: 126, solid: true, showLabel: false },
      { id: "frase-espectro", label: "PALAVRA • FRASE • SENTIDO • TEXTO", type: "language-inscription", operation: "espectro", x: 2220, y: 205, w: 560, h: 50, solid: false, showLabel: true },

      { id: "marco-port-oeste", label: "SINÔNIMO ≠ ANTÔNIMO", type: "language-inscription", operation: "semantica", x: 1400, y: 1950, w: 360, h: 50, solid: false, showLabel: true },
      { id: "marco-port-leste", label: "S → V → C", type: "language-inscription", operation: "sintaxe", x: 3250, y: 1950, w: 280, h: 50, solid: false, showLabel: true },
      { id: "marco-espectro", label: "LEIA O QUE ESTÁ ENTRE AS PALAVRAS", type: "language-inscription", operation: "espectro", x: 2170, y: 600, w: 660, h: 50, solid: false, showLabel: true }
    ],
    treeObjects: [
      { id: "arvore-palavra-01", label: "Árvore de Letras 1", x: 120, y: 1440, w: 128, h: 118 },
      { id: "arvore-palavra-02", label: "Árvore de Letras 2", x: 260, y: 1880, w: 112, h: 104 },
      { id: "arvore-palavra-03", label: "Árvore de Letras 3", x: 620, y: 1360, w: 122, h: 112 },
      { id: "arvore-palavra-04", label: "Árvore de Letras 4", x: 1040, y: 1430, w: 116, h: 108 },
      { id: "arvore-palavra-05", label: "Árvore de Letras 5", x: 1510, y: 1950, w: 122, h: 112 },
      { id: "arvore-palavra-06", label: "Árvore de Letras 6", x: 1750, y: 1480, w: 116, h: 108 },
      { id: "arvore-palavra-07", label: "Árvore de Letras 7", x: 180, y: 2760, w: 128, h: 118 },
      { id: "arvore-palavra-08", label: "Árvore de Letras 8", x: 620, y: 2990, w: 112, h: 104 },
      { id: "arvore-palavra-09", label: "Árvore de Letras 9", x: 4310, y: 2980, w: 128, h: 118 },
      { id: "arvore-palavra-10", label: "Árvore de Letras 10", x: 4710, y: 2740, w: 112, h: 104 },
      { id: "arvore-palavra-11", label: "Árvore de Letras 11", x: 1380, y: 470, w: 108, h: 104 },
      { id: "arvore-palavra-12", label: "Árvore de Letras 12", x: 3510, y: 470, w: 108, h: 104 },
      { id: "arvore-palavra-13", label: "Árvore de Letras 13", x: 830, y: 2030, w: 124, h: 112 },
      { id: "arvore-palavra-14", label: "Árvore de Letras 14", x: 4140, y: 1140, w: 110, h: 104 }
    ],
    npcObjects: [
      {
        id: "npc-guardiao-retorno-portugues",
        name: "Guardião do Portal",
        role: "Retorno à Vila Central",
        x: 2920,
        y: 2960,
        colorA: "#ff91c8",
        colorB: "#9d78ff",
        aura: "#8cf7ff",
        portrait: "assets/images/npcs/guardiao-do-portal.webp",
        returnToVillage: true,
        dialogue: [
          "Você chegou à Praça da Palavra. Aqui, uma escolha errada não quebra apenas uma frase: ela pode quebrar o próprio caminho.",
          "Comece pelo Bairro Ortográfico e reconstrua a primeira Palavra do Mundo. Depois, Semântica e Sintaxe se abrem como dois ramos da mesma linguagem.",
          "Quando quiser voltar à Vila Central, fale comigo novamente."
        ]
      },
      {
        id: "npc-voltinho-portugues",
        name: "Voltinho",
        role: "Guia de Português",
        x: 2080,
        y: 2910,
        colorA: "#ff91c8",
        colorB: "#8cf7ff",
        aura: "#9d78ff",
        portrait: "assets/images/sprites/voltinho_explicando.webp",
        dialogue: [
          "Esse reino não funciona como Matemática. Aqui você vai reconstruir significado, não calcular um valor.",
          "As Palavras do Mundo são frases quebradas. Escolha a palavra correta e o próprio cenário entende o que deveria existir.",
          "Ortcepse vive no Arquivo Invertido. Se chegar até ele, leia tudo com calma: ele adora respostas que parecem certas fora de contexto."
        ]
      },
      {
        id: "terminal-progresso-portugues",
        name: "Índice do Reino",
        role: "Status de Português",
        x: 2500,
        y: 2820,
        visualType: "terminal",
        colorA: "#ff91c8",
        colorB: "#9d78ff",
        aura: "#8cf7ff",
        portrait: "assets/images/sprites/voltinho_pensando.webp",
        dynamicDialogue: "portuguese-progress"
      },
      {
        id: "portao-ortcepse-npc",
        name: "Selo do Arquivo Invertido",
        role: "Acesso ao Ortcepse",
        x: 2180,
        y: 1375,
        visualType: "gate",
        colorA: "#8b829b",
        colorB: "#ff91c8",
        aura: "#9d78ff",
        portrait: "assets/images/mini-bosses/ortcepse.webp",
        dynamicDialogue: "portuguese-mini-gate"
      },
      {
        id: "portao-espectro-npc",
        name: "Portal da Gramática",
        role: "Acesso ao Espectro",
        x: 2180,
        y: 745,
        visualType: "gate",
        colorA: "#b85cff",
        colorB: "#ff7bd5",
        aura: "#b85cff",
        portrait: "assets/images/bosses/espectro-da-gramatica.webp",
        dynamicDialogue: "portuguese-boss-gate"
      }
    ],
    portalObjects: [
      { id: "portal-retorno-portugues", name: "Portal da Praça da Palavra", x: 2500, y: 3050, interactionRange: 0, colorA: "#ff91c8", colorB: "#9d78ff" }
    ],
    worldEquations,
    enemyObjects: []
  };

  global.VoltzData.realms.portuguese = {
    id: "reino-gramatica",
    progressKey: "reino-gramatica",
    name: "Reino de Português",
    enemyTypes,
    commonEnemies,
    miniBoss,
    boss,
    worldEquations,
    progression,
    worldMechanic: {
      name: "Palavra do Mundo",
      pluralName: "Palavras do Mundo",
      panelSubtitle: "Escolha a palavra que devolve coerência a esta parte do Reino de Português.",
      solvedSeal: "✓ PALAVRA RECONSTRUÍDA",
      solvedPrompt: "Esta estrutura linguística já foi restaurada.",
      wrongMessage: "Essa palavra não preserva o sentido ou a estrutura da frase. Releia o contexto e tente novamente.",
      footer: "Cada Palavra do Mundo reconstruída altera fisicamente o reino e conta para liberar o Arquivo Invertido.",
      successSuffix: "A linguagem desta região voltou a fazer sentido."
    },
    scene
  };
})(window);
