import { db } from './firebase-config.js';
import { collection, addDoc, deleteDoc, doc, onSnapshot } 
from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// --- NAVEGAÇÃO ---
window.mostrarTela = (idTela) => {
    const telas = ['tela-lancar', 'tela-admin', 'tela-relatorio'];
    telas.forEach(t => document.getElementById(t).style.display = 'none');
    document.getElementById(idTela).style.display = 'block';
};

window.acessoAdmin = () => {
    if(prompt("Senha Master:") === "1234") {
        window.mostrarTela('tela-admin');
    } else {
        alert("Senha incorreta");
    }
};

// --- LOGICA MEDICOS ---
window.salvarMedico = async () => {
    const nome = document.getElementById('nomeMedico').value;
    const porcento = document.getElementById('porcentagem').value;
    if(!nome || !porcento) return;

    await addDoc(collection(db, "medicos"), {
        nome: nome,
        repasse: parseFloat(porcento) / 100
    });
    alert("Médico Salvo!");
};

// Escuta Médicos e atualiza Select/Lista
onSnapshot(collection(db, "medicos"), (snap) => {
    const lista = document.getElementById('listaMedicos');
    const select = document.getElementById('atendMedico');
    lista.innerHTML = "";
    select.innerHTML = '<option value="">Médico...</option>';

    snap.forEach(d => {
        const m = d.data();
        lista.innerHTML += `<div class="medico-item">${m.nome} <button onclick="deletarMedico('${d.id}')">X</button></div>`;
        select.innerHTML += `<option value="${m.repasse}">${m.nome}</option>`;
    });
});

window.deletarMedico = async (id) => {
    await deleteDoc(doc(db, "medicos", id));
};

// --- LOGICA CONSULTAS ---
window.salvarConsulta = async () => {
    const pac = document.getElementById('nomePaciente').value;
    const sel = document.getElementById('atendMedico');
    const val = parseFloat(document.getElementById('valorAtend').value);

    if(!pac || !sel.value || !val) return alert("Preencha tudo");

    await addDoc(collection(db, "atendimentos"), {
        paciente: pac,
        medico: sel.options[sel.selectedIndex].text,
        valorBruto: val,
        lucroClinica: val * (1 - parseFloat(sel.value)),
        data: new Date().toLocaleDateString()
    });
    alert("Lançado!");
};