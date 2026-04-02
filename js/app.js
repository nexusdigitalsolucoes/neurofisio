import { db } from './firebase-config.js';
import { collection, addDoc, deleteDoc, doc, onSnapshot } 
from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Importando seu novo utilitário
import { formatarMoeda } from './utils/formatadores.js';

// --- NAVEGAÇÃO ---
// js/app.js - Versão que não quebra se faltar tela
window.mostrarTela = (idTela) => {
    // Lista exata dos IDs que você tem no seu HTML
    const telas = ['tela-lancar', 'tela-admin', 'tela-relatorio', 'tela-paciente'];
    
    telas.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            // Só tenta mexer no style se o elemento realmente existir
            elemento.style.display = 'none';
        }
    });
    
    const telaAlvo = document.getElementById(idTela);
    if (telaAlvo) {
        telaAlvo.style.display = 'block';
    } else {
        console.error(`Erro: A tela com ID "${idTela}" não foi encontrada no HTML!`);
    }
};

window.acessoAdmin = () => {
    const senha = prompt("Senha Master:");
    if(senha === "1234") {
        window.mostrarTela('tela-admin');
    } else {
        alert("Senha incorreta!");
    }
};

// --- CONSULTAS (COM LIMPEZA E BLOQUEIO DE BOTÃO) ---
window.salvarConsulta = async () => {
    const btn = document.querySelector('#tela-lancar .btn-principal');
    const inputPac = document.getElementById('nomePaciente');
    const inputVal = document.getElementById('valorAtend');
    const selMed = document.getElementById('atendMedico');

    if(!inputPac.value || !selMed.value || !inputVal.value) {
        return alert("⚠️ Preencha todos os campos antes de salvar.");
    }

    // Bloqueia o botão para evitar duplicados
    btn.disabled = true;
    btn.innerText = "Salvando no sistema...";

    try {
        const valor = parseFloat(inputVal.value);
        const repasseMedico = parseFloat(selMed.value);

        await addDoc(collection(db, "atendimentos"), {
            paciente: inputPac.value,
            medico: selMed.options[selMed.selectedIndex].text,
            valorBruto: valor,
            lucroClinica: valor * (1 - repasseMedico),
            data: new Date().toLocaleDateString('pt-BR'),
            timestamp: new Date()
        });

        alert("✅ Lançamento realizado com sucesso!");

        // LIMPEZA DOS CAMPOS
        inputPac.value = "";
        inputVal.value = "";
        selMed.selectedIndex = 0;

    } catch (e) {
        alert("Erro técnico: " + e.message);
    } finally {
        // Libera o botão novamente
        btn.disabled = false;
        btn.innerText = "Finalizar Lançamento";
    }
};

// --- MÉDICOS ---
window.salvarMedico = async () => {
    const nome = document.getElementById('nomeMedico').value;
    const porcento = document.getElementById('porcentagem').value;
    if(!nome || !porcento) return alert("Preencha os dados do médico.");

    await addDoc(collection(db, "medicos"), {
        nome: nome,
        repasse: parseFloat(porcento) / 100
    });
    
    document.getElementById('nomeMedico').value = "";
    document.getElementById('porcentagem').value = "";
    alert("Médico cadastrado!");
};

onSnapshot(collection(db, "medicos"), (snap) => {
    const lista = document.getElementById('listaMedicos');
    const select = document.getElementById('atendMedico');
    lista.innerHTML = "";
    select.innerHTML = '<option value="">Selecione o Médico...</option>';

    snap.forEach(d => {
        const m = d.data();
        lista.innerHTML += `
            <div class="medico-item">
                <span>${m.nome} - Repasse: ${m.repasse * 100}%</span>
                <button class="btn-excluir" onclick="deletarMedico('${d.id}')">Excluir</button>
            </div>`;
        select.innerHTML += `<option value="${m.repasse}">${m.nome}</option>`;
    });
});

window.deletarMedico = async (id) => {
    if(confirm("Tem certeza que deseja remover este médico?")) {
        await deleteDoc(doc(db, "medicos", id));
    }
};