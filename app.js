// Importar módulos express
const express = require('express');

// Importar módulo express-fileupload
const upload = require('express-fileupload');

// Importa módulo express-handlebars
const { engine } = require('express-handlebars');

// Importar módulo mysql
const mysql = require('mysql2');

//App
const app = express();

// Habilitando o upload de arquivos
app.use(upload());

// File System (Manipulação de arquivos)
const fs = require('fs')

// Adicionando bootstrap
app.use('/bootstrap', express.static('.node_modules/bootstrap/dist'));

// Localizar a pasta de imagens para o formulario
app.use('/imagens', express.static('./imagens'));

// Configurções do express-handlebars
app.engine('handlebars', engine(
    {
    helpers: {
      // Função auxiliar para verificar igualdade
      condicionalIgualdade: function (parametro1, parametro2, options) {
        return parametro1 === parametro2 ? options.fn(this) : options.inverse(this);
      }
    }
  }
));
app.set('view engine', 'handlebars');
app.set('views', './views');

//Manipulação de dados via rotas
app.use(express.json());
app.use(express.urlencoded({ extended: false }))

//Configuração de conexão
const conexão = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'node.js'
});

//Teste
conexão.connect(function (erro) {
    if (erro) throw erro;
    console.log('Conexão efetuada com sucesso!');
});
// REQ = Passar parametros como informações do tipo json, ou seja, req captura informações
// RES = Seria a Resposta, quando eu quiser exibir algo como um texto, ou seja, o res é a resposta do cliente para o req

//Rota Principal
app.get('/', function (req, res) {
    //SQL
    const sql = `SELECT * FROM produtos`

    conexão.query(sql, function (erro, retorno) {
        if (erro) throw erro;

        res.render('formulario', { produtos: retorno });

    });
});

//Rota Principal contendo a situação
app.get('/:situacao', function (req, res) {
    //SQL
    const sql = `SELECT * FROM produtos`

    conexão.query(sql, function (erro, retorno) {
        if (erro) throw erro;

        res.render('formulario', { produtos: retorno, situacao: req.params.situacao });

    });
});

// Rota de Remoção
app.get('/deletar/:id_produto&:imagem_produto', function (req, res) {
   try{
    const id_produto = req.params.id_produto;
    const imagem_produto = req.params.imagem_produto
    const sql = `DELETE FROM produtos WHERE id_produto = ${id_produto}`

    conexão.query(sql, function (erro, retorno) {
        if (erro) throw retorno

        // Lógica para deletar uma imagem da pasta
        fs.unlink(__dirname + '/imagens/' + imagem_produto, (erro_imagem) => { console.log("Falha ao remover a imagem") })
    })
    res.redirect('/okRemover')
   }catch(erro){
    res.redirect('/falhaRemover')
   }
});

//Rota de Cadastro

app.post('/cadastrar', function (req, res) {

    try {
        // Obter os dados que serão utilizados para o cadastro
        const nome_produto = req.body.nome_produto
        const preco_produto = req.body.preco_produto
        const imagem_produto = req.files.imagem_produto.name

        // Validar o nome do produto e o valor 
        if (nome_produto == '' || preco_produto == '' || isNaN == (preco_produto) ) {
            res.redirect('/falhaCadastrar')
        } else {
            //SQL
            const sql = `INSERT INTO produtos (nome_produto, preco_produto, imagem_produto) VALUES ('${nome_produto}', ${preco_produto}, '${imagem_produto}')`

            conexão.query(sql, function (erro, retorno) {
                if (erro) throw erro;

                // Movendo imagem e guardando numa pasta
                const caminho_imagem = __dirname + '/imagens/' + req.files.imagem_produto.name // Salvando o caminho numa variavel
                req.files.imagem_produto.mv(caminho_imagem);
                console.log(retorno);

                res.redirect('/okCadastrar'); 
            });
        }

    } catch (erro) {
        res.redirect('/falhaCadastrar');
    }

});

//Rota de Editar
app.get('/editar/:id_produto', function (req, res) {
    const id_produto = req.params.id_produto;
    const sql = `SELECT * FROM produtos WHERE id_produto = ${id_produto}`

    conexão.query(sql, function (erro, retorno) {
        if (erro) throw erro
        res.render('formulario_editar', { produto: retorno[0] })

    })

})

app.post('/editar', function (req, res) {
    const id_produto = req.body.id_produto;
    const nome_produto = req.body.nome_produto;
    const preco_produto = req.body.preco_produto;
    const imagem_produto = req.body.imagemAtual;


    try {
        //Validar nome do produto e preço
        if (req.files && req.files.novaImagem || nome_produto == '' || preco_produto == '' || preco_produto == isNaN(preco_produto)) {
            const novaImagem = req.files.novaImagem;
            const sql = `UPDATE produtos SET nome_produto='${nome_produto}',preco_produto='${preco_produto}',imagem_produto='${novaImagem.name}' WHERE id_produto = ${id_produto}`;

            //Executando comando SQL
            conexão.query(sql, function (erro, retorno) {
                if (erro) throw erro;

                //Removendo a imagem antiga
                fs.unlink(__dirname + '/imagens/' + imagem_produto, (erro_imagem) => {
                    console.log(erro_imagem);
                    console.log(imagem_produto);
                });

                //Cadastrando imagem nova
                novaImagem.mv(__dirname + '/imagens/' + novaImagem.name);
            });
        } else {
            const sql = `UPDATE produtos SET nome_produto='${nome_produto}',preco_produto='${preco_produto}' WHERE id_produto = ${id_produto}`;

            conexão.query(sql, function (erro, retorno) {
                if (erro) throw erro;
            });
            res.redirect('/okEditar')
        }
    } catch (erro) {
        res.redirect('/falhaEditar')
        console.log('Erro ao atualizar produto:', erro.message);
    }




    res.redirect('/')
})





//Servidor
app.listen(8080);