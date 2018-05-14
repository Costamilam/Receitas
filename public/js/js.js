//Dados do firebase (database, storage e auth) e variável de referência (chave do usuario logado)
let chave_usuario = '';
let chave_receita = '';
let acesso = firebase.database().ref('receita/acesso');
let dado = firebase.database().ref('receita/dado');
let arquivo = firebase.storage().ref();
let autenticacao = firebase.auth();
let provedor = firebase.auth;
autenticacao.languageCode = 'pt-br';

//Variável que vai conter um novo provedor
let provider;

//Variáveis utilizadas em leituras e escritas no banco
let objeto;
let url;
let chave;

//variáveis de busca simples
let busca_valor;
let nomes;
let divs;

//Variável que vai conter as expressões regulares para validação
let expressao_regular;

//Blocos do HTML que exibe os botões de ação (adição, atualização, remoção e seleção), logo e listas de receitas (minhas, favoritas e públicas)
let acao = document.getElementById('acoes');
let logo = document.getElementById('logo');
let minha_receita = document.getElementById('minhas_receitas');
let receita_favorita = document.getElementById('receitas_favoritas');
let receita_publica = document.getElementById('receitas_publicas');
let menu_lista_receita = document.getElementById('receitas');

//Formulários do HTML de autenticação, manipulação e busca de receitas
let formConectar = document.getElementById('form_conectar');
let formReceita = document.getElementById('form_receita');
let formBuscar = document.getElementById('form_busca');

//Funções que autentica por provider (Google, Facebook, Twitter ou Github)
document.getElementById('btn_google').addEventListener('click', function() {
	provider = new provedor.GoogleAuthProvider();
	conectar(provider);
});

document.getElementById('btn_facebook').addEventListener('click', function() {
	provider = new provedor.FacebookAuthProvider();
	conectar(provider);
});

document.getElementById('btn_github').addEventListener('click', function() {
	provider = new provedor.GithubAuthProvider();
	conectar(provider);
});

document.getElementById('btn_twitter').addEventListener('click', function() {
	provider = new provedor.TwitterAuthProvider();
	conectar(provider);
});

//Função que autentica por provider (Google, Facebook, Twitter ou Github)
function conectar(provider) {
	autenticacao.signInWithPopup(provider).then(function(result) {
    	chave_usuario = result.user.uid;
    	
    	mudar(true);
        
        M.toast({html: `<p>Bem vindo ${result.user.displayName}</p>`});
    }).catch(function (error) {
        M.toast({html: '<p>Erro ao tentar conectar ao sistema</p>'});

        error.code == 'auth/account-exists-with-different-credential' ? M.toast({html: 'Você já possui uma conta, porém com credencias diferentes!'}) : M.toast({html: 'Falha na autenticação'});
    });
}

//Função que desconecta o usuário autenticado
document.getElementById('desconectar').addEventListener('click', function() {
	autenticacao.signOut().then(function() {
  		chave_usuario = '';

		limparCampos();

		mudar(false);

        M.toast({html: '<p>Desconectado</p>'});
	}).catch(function(error) {
		M.toast({html: '<p>Erro na tentativa de desconexão</p>'});
	});
});

//Variáveis de entrada do formulário de receita
let nome = document.getElementById('nome');
let ingrediente = document.getElementById('ingrediente');
let preparo = document.getElementById('preparo');
let imagem = document.getElementById('imagem');
let imagem_texto = document.getElementById('imagem_texto');
let publico = document.getElementById('publico');
let privado = document.getElementById('privado');
let busca = document.getElementById('busca');

//Variáveis utilizadas para guardar o valor das entradas
let valorNome;
let valorIngrediente;
let valorPreparo;
let valorImagem;
let nomeImagemAntiga;
let nomeImagem;
let valorPublico;
let valorPrivado;
let tipo;

//Função que atualiza a lista de receitas
document.getElementById('atualizar').addEventListener('click', function() {
	limparCampos();
	receita_publica.innerHTML = '';
	acessar_receita_publica();
});

//Função de adição de receitas no banco de dados
document.getElementById('adicionar').addEventListener('click', function() {
	valorNome = nome.value;
	valorIngrediente = ingrediente.value;
	valorPreparo = preparo.value;
	valorImagem = imagem.files[0];
	nomeImagem = null;
	valorPublico = publico.checked;
	valorPrivado = privado.checked;

	if(validar_nome(valorNome) && validar_ingrediente(valorIngrediente) && validar_preparo(valorPreparo) && validar_tipo(valorPrivado, valorPublico) && (valorImagem === undefined || validar_imagem(valorImagem.name))) {
		valorIngrediente = [];
		for (let i = 0; i < ingrediente.value.split('\n').length; i++) {
			valorIngrediente.push(ingrediente.value.split('\n')[i]);
		}

		tipo = valorPublico;

		if(valorImagem !== undefined) {
			nomeImagem = valorImagem.name;
		}

		Promise.resolve(acesso.push().key)
		.then(function(chave) {
			chave_receita = chave;
			
			acesso.child(chave_receita).set({
				tipo: tipo, 
				usuario: chave_usuario 
			});
		})
		.then(function() {
			dado.child(chave_receita).set({ 
				nome: valorNome, 
				ingrediente: valorIngrediente, 
				preparo: valorPreparo, 
				imagem: nomeImagem, 
			});
		})
		.then(function() {
			if(valorImagem !== undefined) {
				arquivo.child(`${chave_receita}/${valorImagem.name}`).put(valorImagem);
			}
		})
		.then(function() {
			M.toast({html: '<p>Receita adicionada</p>'});

			limparCampos();
		})
		.catch(function() { 
			M.toast({html: '<p>Erro ao adicionar a receita</p>'});
		});
	} else {
		M.toast({html: '<p>Preencha os campos nome, ingrediente e modo de preparo!</p>'});
	}
});

//Função que edita uma receita selecionada
document.getElementById('editar').addEventListener('click', function() {
	if(chave_receita != '') {
		valorNome = nome.value;
		valorIngrediente = ingrediente.value;
		valorPreparo = preparo.value;
		valorImagem = imagem.files[0];
		nomeImagem = imagem_texto.value;
		valorPublico = publico.checked;
		valorPrivado = privado.checked;

		if(validar_nome(valorNome) && validar_ingrediente(valorIngrediente) && validar_preparo(valorPreparo) && validar_tipo(valorPrivado, valorPublico) && (valorImagem === undefined || validar_imagem(valorImagem.name))) {
			valorIngrediente = [];
			for (let i = 0; i < ingrediente.value.split('\n').length; i++) {
				valorIngrediente.push(ingrediente.value.split('\n')[i]);
			}

			tipo = valorPublico;

			if(valorImagem !== undefined) {
				nomeImagem = valorImagem.name;
			}

			acesso.child(chave_receita).set({
				tipo: tipo, 
				usuario: chave_usuario 
			})
			.then(function() {
				dado.child(chave_receita).set({ 
					nome: valorNome, 
					ingrediente: valorIngrediente, 
					preparo: valorPreparo, 
					imagem: nomeImagem, 
				});
			})
			.then(function() {
				if(valorImagem !== undefined) {
					excluirImagem(chave_receita);

					arquivo.child(`${chave_receita}/${valorImagem.name}`).put(valorImagem);
				}
			})
			.then(function() {
		        M.toast({html: '<p>Receita atualizada</p>'});

				limparCampos();
			})
			.catch(function() {
				M.toast({html: '<p>Algum erro ocorreu, sua receita não foi atualizada!</p>'});
			});
		}
	} else {
		M.toast({html: '<p>Preencha os campos nome, ingrediente e modo de preparo!</p>'});
	}
});

//Função que exclui a receita selecionada
document.getElementById('excluir').addEventListener('click', function() {
	if(chave_receita != '') {
		dado.child(chave_receita).remove().then(function() {
			acesso.child(chave_receita).remove();

			arquivo.child(chave_receita).child(imagem_texto.value).delete();
		})
		.then(function() {
        	M.toast({html: '<p>Receita removida</p>'});

			limparCampos();
		})
		.catch(function() {
			M.toast({html: '<p>Algum erro ocorreu, sua receita não foi totalmente removida removida!</p>'});
		});
	} else {
		M.toast({html: '<p>Selecione uma receita antes!</p>'});
	}
});

//Função que busca uma receita da lista pelo nome
busca.addEventListener('keyup', function() {
	clearTimeout();

	setTimeout(function() {
		busca_valor = busca.value;
		nomes = document.getElementsByClassName('card-title');
		divs = document.getElementsByClassName('div_receita');

		for (let i = 0; i < nomes.length; i++) {
			divs[i].style.display = 'block';
		}

		if(validar_busca(busca_valor)) {
			for (let i = 0; i < nomes.length; i++) {
				if(nomes[i].firstChild.nodeValue.search(busca_valor) == -1) {
					divs[i].style.display = 'none';
				}
			}
		}
	}, 3000);
});

//Função que busca uma receita do banco pelo nome, ingrediente ou modo de preparo
/*document.getElementById('busca_avancada').addEventListener('click', function() {
	var busca_valor = busca.value;
	if(validar_busca(busca_valor)) {
		limparCampos();
		
		database.orderByChild('nome').once('value').then(function(snapshot) {
			snapshot.forEach(function(childSnapshot) {
		      	var chave = childSnapshot.key;
		      	var obj = childSnapshot.val();
				if(obj.nome.search(busca_valor) != -1 || obj.ingrediente.toString().search(busca_valor) != -1 || obj.preparo.search(busca_valor) != -1) {
			      	var url;
			      	if(obj.imagem == './image/default.png') {
		      			url = './image/default.png';
			      	} else
		  				url = 'https://firebasestorage.googleapis.com/v0/b/receitas-alpha.appspot.com/o/' + chave + '%2F' + obj.imagem + '?alt=media&token=c634d1db-dc4c-4cb9-8630-fbedff537237';
					mostrar(chave, obj.nome, url);
		  		}
		  	})
		});
	} else {
		M.toast({html: '<p>Preencha todos os campos!</p>'});
	}
});*/

//Função que lê o acesso, os dados e mostra as receitas pessoais, favoritas e públicas
function acessar_minha_receita() {
	M.toast({html: '<p>Atualizando lista de minhas receitas</p>'});

	acesso.orderByChild('usuario').equalTo(chave_usuario).once('value').then(function(snapshot) {
		snapshot.forEach(function(childSnapshot) {
			(function(chave, tipo) {
				dado.child(chave).once('value').then(function(snapshot) {
					objeto = snapshot.val();

					url = objeto.imagem ? `https://firebasestorage.googleapis.com/v0/b/receitas-costamilam.appspot.com/o/${chave}%2F${objeto.imagem}?alt=media&token=8a953e96-fa2e-425d-bcd5-d811e8c6d1a3` : './file/default.png';

					(function(chave, nome, url, tipo) {
						minha_receita.innerHTML += `
							<a class="div_receita" href="#container">
								<div class="col s12 m4 l3" onclick="selecionar('${chave}', ${tipo})">
									<div class="card">
										<div class="card-image">
											<img src="${url}">
											<span class="card-title">${nome}</span>
										</div>
									</div>
								</div>
							</a>
						`;
					})(chave, objeto.nome, url, tipo);
				})
				.catch(function() {
					M.toast({html: '<p>Algum erro ocorreu, uma receita pessoal não pode ser mostrada!</p>'});
				});
			})(childSnapshot.key, childSnapshot.val().tipo);
	  	});
	})
	.catch(function() {
		M.toast({html: '<p>Algum erro ocorreu, sua lista de receitas pessoais não foi atualizada!</p>'});
	});
}
function acessar_receita_favorita() {
	M.toast({html: '<p>Atualizando lista de receitas favoritas</p>'});

	acesso.orderByChild('usuario').equalTo(chave_usuario).once('value').then(function(snapshot) {
		snapshot.forEach(function(childSnapshot) {
			(function(chave, tipo) {
				dado.child(chave).once('value').then(function(snapshot) {
					objeto = snapshot.val();
			
					url = objeto.imagem ? `https://firebasestorage.googleapis.com/v0/b/receitas-costamilam.appspot.com/o/${chave}%2F${objeto.imagem}?alt=media&token=8a953e96-fa2e-425d-bcd5-d811e8c6d1a3` : './file/default.png';
			
					(function(chave, nome, url, tipo) {
						receita_favorita.innerHTML += `
							<a class="div_receita" href="#container">
								<div class="col s12 m4 l3" onclick="selecionar('${chave}', ${tipo})">
									<div class="card">
										<div class="card-image">
											<img src="${url}">
											<span class="card-title">${nome}</span>
										</div>
									</div>
								</div>
							</a>
						`;
					})(chave, objeto.nome, url, tipo);
				})
				.catch(function() {
					M.toast({html: '<p>Algum erro ocorreu, uma receita favorita não pode ser mostrada!</p>'});
				});
			})(childSnapshot.key, childSnapshot.val().tipo);
	  	});
	})
	.catch(function() {
		M.toast({html: '<p>Algum erro ocorreu, sua lista de receitas favoritas não foi atualizada!</p>'});
	});
}
function acessar_receita_publica() {
	M.toast({html: '<p>Atualizando lista de receitas favoritas</p>'});

	acesso.orderByChild('tipo').equalTo(true).once('value').then(function(snapshot) {
		snapshot.forEach(function(childSnapshot) {
	      	objeto = childSnapshot.val();

	      	if(objeto.usuario != chave_usuario) { 
				(function(chave, tipo) {
					dado.child(chave).once('value').then(function(snapshot) {
						  objeto = snapshot.val();
				
						  url = objeto.imagem ? `https://firebasestorage.googleapis.com/v0/b/receitas-costamilam.appspot.com/o/${chave}%2F${objeto.imagem}?alt=media&token=8a953e96-fa2e-425d-bcd5-d811e8c6d1a3` : './file/default.png';
				
						(function(chave, nome, url, tipo) {
							receita_publica.innerHTML += `
								<a class="div_receita" href="#container">
									<div class="col s12 m4 l3" onclick="selecionar('${chave}', ${tipo})">
										<div class="card">
											<div class="card-image">
												<img src="${url}">
												<span class="card-title">${nome}</span>
											</div>
										</div>
									</div>
								</a>
							`;
						})(chave, objeto.nome, url, tipo);
					})
					.catch(function() {
						M.toast({html: '<p>Algum erro ocorreu, uma receita pública não pode ser mostrada!</p>'});
					});
				})(childSnapshot.key, objeto.tipo);
			}
	  	});
	})
	.catch(function() {
		M.toast({html: '<p>Algum erro ocorreu, a lista de receitas públicas não foi atualizada!</p>'});
	});
}

//Função que seleciona uma receita a partir da chave passada por parâmetro
function selecionar(chave, tipo) {
	chave_receita = chave;

	dado.child(chave).once('value').then(function(snapshot) {
		tipo ? publico.checked = true : privado.checked = true;

		nome.value = snapshot.val().nome;
		nome.classList.add('valid');

		for(let i = 0; i < snapshot.val().ingrediente.length; i++) {
			ingrediente.value += snapshot.val().ingrediente[i] + '\n';
		}
		ingrediente.classList.add('valid');

		preparo.value = snapshot.val().preparo;
		preparo.classList.add('valid');

		if(snapshot.val().imagem) { 
			imagem_texto.value = snapshot.val().imagem;
			imagem_texto.classList.remove('valid');
		}

		M.updateTextFields();
	})
	.catch(function() {
		M.toast({html: '<p>Algum erro ocorreu, essa receita não pode ser mostrada!</p>'});
	});
}

//Função que exclui a imagem anterior da receita
function excluirImagem(chave) {
	dado.child(`${chave}/imagem`).once('value').then(function(snapshot) { 
		nomeImagemAntiga = snapshot.val();
	})
	.then(function() {
		if(nomeImagemAntiga && nomeImagemAntiga != nomeImagem) {
			arquivo.child(`${chave}/${nomeImagem}`).delete();
		}
	})
	.catch(function() {
		M.toast({html: '<p>Algum erro ocorreu, a receita pode não ter sua imagem atualizada!</p>'});
	});
}

//Função que limpa o campo de pesquisa ao clicar no ícone "x"
document.getElementById('close').addEventListener('click', function() {
    campoBuscar.value = '';
    buscar_nome();
})

//Função que limpa os campos de entrada da receita e o bloco HTML que exibe a lista de receitas
function limparCampos() {
	minha_receita.innerHTML = '';
	receita_favorita.innerHTML = '';

	acessar_minha_receita();
	acessar_receita_favorita();

	chave_receita = '';
	nome.value = '';
	ingrediente.value = '';
	preparo.value = '';
	imagem.value = '';
	imagem_texto.value = '';
	publico.checked = true;

	nome.classList.remove('valid', 'invalid');
	preparo.classList.remove('valid', 'invalid');
	ingrediente.classList.remove('valid', 'invalid');
	imagem_texto.classList.remove('valid', 'invalid');
	
	M.updateTextFields();
}

//Função que alterna entre os formulários de autenticação de usuários e manipulação de receitas
function mudar(bool) {
	formConectar.style.display = bool ? 'none' : 'block';

	formReceita.style.display = bool ? 'block' : 'none';

	formBuscar.style.display = bool ? 'block' : 'none';

	acao.style.display = bool ? 'block' : 'none';

	menu_lista_receita.style.display = bool ? 'block' : 'none';

	logo.className = bool ? 'brand-logo hide-on-med-and-down' : 'brand-logo center';

	if(bool) {
		acessar_receita_favorita();
		acessar_minha_receita();
		acessar_receita_publica();
	}
}

//Funções de validação dos dados (RegExp)
function validar_nome(nome) {
	expressao_regular = '[A-z]{2}[A-z\- ]{0,28}';

	return nome.match(expressao_regular);
}

function validar_ingrediente(ingrediente) {
	expressao_regular = '[A-z]{2}[A-z\- ]{0,298}';

	return ingrediente.match(expressao_regular);
}

function validar_preparo(preparo) {
	expressao_regular = '[A-z]{2}[A-z\- ]{0,298}';

	return preparo.match(expressao_regular);
}

function validar_imagem(imagem) {
	/*var expressao_regular = '(png|jpeg)'
	var imagem = imagem.name.split('.')
	formato = imagem[imagem.length - 1]
	return formato.match(expressao_regular)*/

	expressao_regular = '^[a-zA-Z0-9-_\.]+\.(jpg|gif|png)$';

	return imagem.match(expressao_regular);
}

function validar_tipo(publico, privado) {
	return (!publico && !privado) || (publico && privado) ? false : true;
}

function validar_busca(busca) {
	expressao_regular = '[A-z]{2}[A-z\- ]{0,28}';

	return busca.match(expressao_regular);
}