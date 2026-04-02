// js/app.js
import { db } from './firebase-config.js'; // O './' indica que está na mesma pasta
import { collection, addDoc, deleteDoc, doc, onSnapshot } 
from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// ... restante do código

// --- NAVEGAÇÃO ---
window.mostrarTela = (idTela) => {
    document.getElementById('tela-lancar').style.display = 'none';
    document.getElementById('tela-admin').style.display = 'none';
    document.getElementById('tela-relatorio').style.display = 'none';
    document.getElementById(idTela).style.display = 'block';
};

window.acessoAdmin = () => {
    const senha = prompt("Senha Master:");
    if(senha === "1234") {
        window.mostrarTela('tela-admin');
    } else {
        alert("Senha incorreta!");
    }
};

// --- MÉDICOS ---
window.salvarMedico = async () => {
    const nome = document.getElementById('nomeMedico').value;
    const porcento = document.getElementById('porcentagem').value;
    if(!nome || !porcento) return alert("Preencha os campos!");

    await addDoc(collection(db, "medicos"), {
        nome: nome,
        repasse: parseFloat(porcento) / 100
    });
    alert("Médico cadastrado!");
};

onSnapshot(collection(db, "medicos"), (snap) => {
    const lista = document.getElementById('listaMedicos');
    const select = document.getElementById('atendMedico');
    lista.innerHTML = "";
    select.innerHTML = '<option value="">Selecione o Médico...</option>';

    snap.forEach(d => {
        const m = d.data();
        lista.innerHTML += `<div class="medico-item">
            <span>${m.nome} (${m.repasse * 100}%)</span>
            <button onclick="deletarMedico('${d.id}')">Excluir</button>
        </div>`;
        select.innerHTML += `<option value="${m.repasse}">${m.nome}</option>`;
    });
});

window.deletarMedico = async (id) => {
    if(confirm("Excluir médico?")) await deleteDoc(doc(db, "medicos", id));
};

// --- CONSULTAS ---
// js/app.js - Atualize a função de consulta
window.salvarConsulta = async () => {
    const btn = document.querySelector('#tela-lancar .btn-principal');
    const inputPac = document.getElementById('nomePaciente');
    const inputVal = document.getElementById('valorAtend');
    const selMed = document.getElementById('atendMedico');

    const pac = inputPac.value;
    const val = parseFloat(inputVal.value);
    const medPercent = parseFloat(selMed.value);

    if(!pac || !selMed.value || !val) return alert("Preencha tudo!");

    // Bloqueia o botão para evitar duplo clique
    btn.disabled = true;
    btn.innerText = "Salvando...";

    try {
        await addDoc(collection(db, "atendimentos"), {
            paciente: pac,
            medico: selMed.options[selMed.selectedIndex].text,
            valorBruto: val,
            lucroClinica: val * (1 - medPercent),
            data: new Date().toLocaleDateString('pt-BR'),
            timestamp: new Date()
        });

        alert("✅ Consulta registrada com sucesso!");

        // LIMPA OS CAMPOS
        inputPac.value = "";
        inputVal.value = "";
        selMed.selectedIndex = 0; // Volta para o "Selecione..."

    } catch (e) {
        alert("Erro ao salvar: " + e.message);
    } finally {
        // Desbloqueia o botão
        btn.disabled = false;
        btn.innerText = "Finalizar Lançamento";
    }
};

import { formatarMoeda } from './utils/formatadores.js';