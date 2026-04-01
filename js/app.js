import { db } from './firebase-config.js';
import { collection, addDoc, deleteDoc, doc, onSnapshot } 
from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// FUNÇÃO DE NAVEGAÇÃO
window.mostrarTela = (idTela) => {
    // Esconde todas as seções primeiro
    document.getElementById('tela-lancar').style.display = 'none';
    document.getElementById('tela-admin').style.display = 'none';
    document.getElementById('tela-relatorio').style.display = 'none';
    
    // Mostra apenas a desejada
    document.getElementById(idTela).style.display = 'block';
};

// ACESSO ADMIN
window.acessoAdmin = () => {
    const senha = prompt("Senha Master:");
    if(senha === "1234") {
        window.mostrarTela('tela-admin');
    } else {
        alert("Senha incorreta!");
    }
};

// ... (Aqui você continua com suas funções salvarMedico e salvarConsulta que já temos)