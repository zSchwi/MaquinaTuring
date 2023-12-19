const readline = require('readline');
const fs = require('fs');
const path = require('path');

// variavel que sera usada para ler a linha do console
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// guarda o diretorio onde o arquivo js esta
const diretorioAtual = path.resolve(__dirname);

// leitura da linha do console e salvando o que foi imputado em dados_lidos
rl.question('', function(dados_lidos) {
    // separacao do que foi lido em tres campos de um vetor
    // 0 - arquivo que sera lido
    // 1 - palavra que sera testada
    // 2 - nome do arquivo de saida
    dados_lidos = dados_lidos.split(' ');
    
    // guarda o que sera lido do arquivo
    let dados_do_arquivo;
    try {
        // leitura do arquivo
        const conteudoDoArquivo = fs.readFileSync(diretorioAtual + '/' + dados_lidos[0], 'utf-8');
        dados_do_arquivo = conteudoDoArquivo.split('\n');
    } catch (error) {
        console.error('Erro na leitura do arquivo:', error);
    }

    let transicoes = [];
    let estados;
    let alfabeto_entrada;
    let alfabeto_fita;

    /**
     * 
     * @param linha no formato {q0,q1,q2,q3,q4},
     * @returns vetor com os dados que estao entre {}
     */
    const setInfo = (linha) => {
        return linha.trim().slice(1, -2).split(',');
    }

    /**
     * 
     * @param linha no padrao (<estado>,<o que se le>)->(<para qual estado vai>,<o que se escreve>,<direcao da transicao>),
     * @returns objeto JS com os dados da transicao
     */
    const setTransicoes = (linha) => {
        let transicao;
        // separa (<estado>,<o que se le>) de (<para qual estado vai>,<o que se escreve>,<direcao da transicao>),
        // o if eh usado apenas para o caso de o ultimo caractere da linha nao ser ,
        if (linha[linha.length - 1] === ')') {
            transicao =  linha.trim().split('->');
            
        }
        else {
            transicao =  linha.trim().slice(0, -1).split('->');
            //console.log(transicao);
        }
        // vetor que guarda (<estado>,<o que se le>)
        let atual_le = transicao[0].slice(1,-1).split(',');
        //console.log(atual_le);
        
        //vetor que guarda (<para qual estado vai>,<o que se escreve>,<direcao da transicao>)
        let prox_estado_escreve_vai_para = transicao[1].slice(1,-1).split(',');
        //console.log(prox_estado_escreve_vai_para);
       
        return {
                estado: atual_le[0], // qual o estado
                le: atual_le[1], // o que esta sendo lido
                escreve: prox_estado_escreve_vai_para[1], // o que se escreve 
                prox_estado: prox_estado_escreve_vai_para[0], // qual o proximo estado
                vai_para: prox_estado_escreve_vai_para[2] // qual a direcao que se vai
            }
    }

    // definicao do conjunto de estado, passando {q0,q1,q2,q3,q4}, para setInfo
    estados = setInfo(dados_do_arquivo[1]);
    //console.log(estados);

    // definindo o alfabeto de entrada, passando {a,b}, para setInfo
    alfabeto_entrada = setInfo(dados_do_arquivo[2]);
    //console.log(alfabeto_entrada);

    // definindo o alfabeto da fita, passando {a,b,Y,B}, para setInfo
    alfabeto_fita = setInfo(dados_do_arquivo[3]);

    // guarda um array de string com as transicoes
    let transicoes_file = [];

    // comeca a ler os dados do arquivo a partir da sexta linha e ignora as quatro ultimas
    // ou seja, le somente as transicoes
    for(i = 5; i < dados_do_arquivo.length - 4; i++){
        transicoes_file.push(dados_do_arquivo[i]);
    }
    //console.log(transicoes_file);

    // guarda um array de objetos com as transicoes de acordo com o retorno da funcao setTransicoes
    for(i = 0; i < transicoes_file.length; i++){
        transicoes.push(setTransicoes(transicoes_file[i]));
    }

    // estado inicial (ler do arquivo)
    estado_inicial = (dados_do_arquivo[dados_do_arquivo.length - 3]).trim().slice(0,-1);

    // conjunto de estados finais (ler do arquivo)
    estados_finais = (dados_do_arquivo[dados_do_arquivo.length - 2]).trim().slice(1,-1).split(',');

    // palavra a ser avaliada (ler do console)
    let palavra = dados_lidos[1];
    
    // colocando B antes e depois da palavra
    palavra = "B" + palavra + "B";

    let ef;
    let saidas = [];
    const leitura = (palavra_ja_avaliada, estado_atual, palavra_a_ser_avaliada) => {
        let saida = palavra_ja_avaliada + "{" + estado_atual + "}" + palavra_a_ser_avaliada;
        //console.log(saida);
        saidas.push(saida);

        // Possibilita que a fita seja infinita a direita
        // A palavra a ser avaliada nunca pode ser vazia
        if(palavra_a_ser_avaliada.length == 0)
            palavra_a_ser_avaliada = "B";

        for(i = 0; i < transicoes.length; i++){
            if(transicoes[i].estado == estado_atual){
                if(transicoes[i].le == palavra_a_ser_avaliada[0]){
                    if(transicoes[i].vai_para == 'E'){
                        // impede que va para a esquerda na primeira transicao
                        if(palavra_ja_avaliada == "")
                            i = transicoes.length;
                        else{
                            palavra_a_ser_avaliada = transicoes[i].escreve + palavra_a_ser_avaliada.substring(1);
                            palavra_a_ser_avaliada = palavra_ja_avaliada.charAt(palavra_ja_avaliada.length - 1) + palavra_a_ser_avaliada;
                            palavra_ja_avaliada = palavra_ja_avaliada.slice(0,-1);
                        }
                    }
                    else {
                        palavra_ja_avaliada += transicoes[i].escreve;
                        palavra_a_ser_avaliada = palavra_a_ser_avaliada.slice(1);
                    }
                    if(i != transicoes.length) {
                        ef = transicoes[i].prox_estado;
                        leitura(palavra_ja_avaliada, transicoes[i].prox_estado, palavra_a_ser_avaliada);
                    }
                }
            }
        }
    }

    // chamada do metodo passando o simbolo inicial e a palavra
    leitura("", estado_inicial, palavra);
    
    let bo_aceita_rejeita = false;
    for(i = 0; i < estados_finais.length; i++){
        if(estados_finais[i] == ef){
            bo_aceita_rejeita = true;
        }
    }

    if(bo_aceita_rejeita)
        saidas.push('aceita');
    else
        saidas.push('rejeita');

    fs.writeFile(diretorioAtual + '/' + dados_lidos[2], saidas.join('\n'), (err) => {
        if (err) {
          console.error('Erro ao escrever no arquivo:', err);
        } else {
          console.log('Os dados foram gravados no arquivo com sucesso.');
        }
    });

    rl.close();
});