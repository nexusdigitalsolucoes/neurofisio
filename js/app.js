import { db } from './firebase-config.js';
import {
    collection, addDoc, deleteDoc, doc, onSnapshot, query, where, orderBy, Timestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

import { formatarMoeda } from './utils/formatadores.js';

console.log("O arquivo app.js foi carregado com sucesso!");

// --- NAVEGAÇÃO ---
window.mostrarTela = (idTela) => {
    const telas = ['tela-lancar', 'tela-admin', 'tela-relatorio', 'tela-paciente'];
    telas.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = 'none';
        }
    });

    const telaAlvo = document.getElementById(idTela);
    if (telaAlvo) {
        telaAlvo.style.display = 'block';
        // Se abrir a tela de relatório, atualiza os dados automaticamente
        if (idTela === 'tela-relatorio') window.filtrarRelatorio('todos');
    }
};

window.acessoAdmin = () => {
    const senha = prompt("Senha Master:");
    if (senha === "1234") {
        window.mostrarTela('tela-admin');
    } else {
        alert("Senha incorreta!");
    }
};

// --- FUNÇÃO GENÉRICA PARA DELETAR ---
window.deletarDoc = async (colecao, id) => {
    if (confirm("Tem certeza que deseja excluir?")) {
        try {
            await deleteDoc(doc(db, colecao, id));
            console.log(`${colecao} removido com sucesso.`);
        } catch (error) {
            console.error("Erro ao deletar:", error);
        }
    }
};

// --- GESTÃO DE MÉDICOS ---
window.salvarMedico = async () => {
    const nomeInput = document.getElementById('nomeMedico');
    const porcentoInput = document.getElementById('porcentagem');

    if (!nomeInput.value || !porcentoInput.value) return alert("Preencha os dados do médico.");

    await addDoc(collection(db, "medicos"), {
        nome: nomeInput.value,
        repasse: parseFloat(porcentoInput.value) / 100
    });

    nomeInput.value = "";
    porcentoInput.value = "";
    alert("Médico cadastrado!");
};

onSnapshot(collection(db, "medicos"), (snap) => {
    const lista = document.getElementById('listaMedicos');
    const select = document.getElementById('atendMedico');
    if (!lista || !select) return;

    lista.innerHTML = "";
    select.innerHTML = '<option value="">Selecione o Médico...</option>';

    snap.forEach(d => {
        const m = d.data();
        lista.innerHTML += `
            <div class="medico-item">
                <span>${m.nome} - Repasse: ${m.repasse * 100}%</span>
                <button class="btn-excluir" onclick="deletarDoc('medicos','${d.id}')">Excluir</button>
            </div>`;
        select.innerHTML += `<option value="${m.repasse}">${m.nome}</option>`;
    });
});

// --- GESTÃO DE PACIENTES ---
window.salvarPaciente = async () => {
    const nomeInput = document.getElementById('pacienteNome');
    const cpfInput = document.getElementById('pacienteCpf');
    const telInput = document.getElementById('pacienteTelefone');

    if (!nomeInput.value) return alert("O nome é obrigatório!");

    await addDoc(collection(db, "pacientes"), {
        nome: nomeInput.value,
        cpf: cpfInput.value,
        telefone: telInput.value,
        dataCadastro: new Date()
    });

    alert("Paciente cadastrado!");
    nomeInput.value = "";
    cpfInput.value = "";
    telInput.value = "";
};

onSnapshot(collection(db, "pacientes"), (snap) => {
    const lista = document.getElementById('listaPacientes');
    const selectAtend = document.getElementById('nomePacienteSelect');

    if (lista) lista.innerHTML = "";
    if (selectAtend) selectAtend.innerHTML = '<option value="">Selecione o Paciente...</option>';

    snap.forEach(d => {
        const p = d.data();
        if (lista) {
            lista.innerHTML += `
                <div class="medico-item">
                    <span>${p.nome}</span> 
                    <button class="btn-excluir" onclick="deletarDoc('pacientes','${d.id}')">Excluir</button>
                </div>`;
        }
        if (selectAtend) {
            selectAtend.innerHTML += `<option value="${p.nome}">${p.nome}</option>`;
        }
    });
});

// --- LANÇAMENTO DE CONSULTA ---
window.salvarConsulta = async () => {
    const btn = document.querySelector('#tela-lancar .btn-principal');
    const inputPac = document.getElementById('nomePacienteSelect');
    const inputVal = document.getElementById('valorAtend');
    const selMed = document.getElementById('atendMedico');

    if (!inputPac.value || !selMed.value || !inputVal.value) {
        return alert("⚠️ Por favor, selecione o paciente, o médico e o valor.");
    }

    btn.disabled = true;
    btn.innerText = "Salvando...";

    try {
        const valorBruto = parseFloat(inputVal.value);
        const percentualMedico = parseFloat(selMed.value);
        const lucroClinica = valorBruto * (1 - percentualMedico);

        await addDoc(collection(db, "atendimentos"), {
            paciente: inputPac.value,
            medico: selMed.options[selMed.selectedIndex].text,
            valorBruto: valorBruto,
            lucroClinica: lucroClinica,
            data: new Date().toLocaleDateString('pt-BR'),
            timestamp: new Date()
        });

        alert("✅ Consulta lançada!");
        inputVal.value = "";
        inputPac.selectedIndex = 0;
        selMed.selectedIndex = 0;

    } catch (e) {
        alert("Erro ao salvar: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Finalizar Lançamento";
    }
};

// --- RELATÓRIOS E FILTROS ---
// Variável para evitar múltiplas conexões abertas ao mesmo tempo
let escutaAtual = null;

window.filtrarRelatorio = (periodo) => {
    if (escutaAtual) escutaAtual();

    const atendimentosRef = collection(db, "atendimentos");
    let q;
    const agora = new Date();

    // Filtros de Data
    if (periodo === 'hoje') {
        const inicioDia = new Date();
        inicioDia.setHours(0, 0, 0, 0);
        q = query(atendimentosRef, where("timestamp", ">=", Timestamp.fromDate(inicioDia)), orderBy("timestamp", "desc"));
    } 
    else if (periodo === 'mes') {
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        q = query(atendimentosRef, where("timestamp", ">=", Timestamp.fromDate(inicioMes)), orderBy("timestamp", "desc"));
    } 
    else {
        // "TUDO" - Se a ordenação por timestamp bugar por causa de dados velhos, 
        // usamos uma consulta simples sem ordem para garantir que TUDO apareça.
        q = query(atendimentosRef); 
    }

    escutaAtual = onSnapshot(q, (snap) => {
        const corpo = document.getElementById('corpoRelatorio');
        if (!corpo) return;
        
        let bruto = 0; let lucro = 0;
        corpo.innerHTML = "";

        if (snap.empty) {
            corpo.innerHTML = "<tr><td colspan='5' style='text-align:center'>Nenhum dado encontrado para este filtro.</td></tr>";
        }

        snap.forEach(d => {
            const at = d.data();
            const vBruto = at.valorBruto || 0;
            const vLucro = at.lucroClinica || 0;
            
            bruto += vBruto;
            lucro += vLucro;

            corpo.innerHTML += `
                <tr>
                    <td>${at.data || '---'}</td>
                    <td>${at.paciente || '---'}</td>
                    <td>${at.medico || '---'}</td>
                    <td>${formatarMoeda(vBruto)}</td>
                    <td>${formatarMoeda(vLucro)}</td>
                </tr>`;
        });

        document.getElementById('totalBruto').innerText = formatarMoeda(bruto);
        document.getElementById('totalLucro').innerText = formatarMoeda(lucro);
        document.getElementById('totalMedicos').innerText = formatarMoeda(bruto - lucro);
    });
};

// fim do filtro relatório


// --- EXPORTAR PDF (TUDO INTEGRADO AQUI) ---
window.gerarPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Cabeçalho do PDF
    doc.setFontSize(18);
    doc.setTextColor(29, 53, 87); // Cor azul escuro
    doc.text("Relatório de Atendimentos - Neurofisioreabilith", 14, 20);

    // Captura os valores que estão aparecendo nos cards da tela
    const bruto = document.getElementById('totalBruto').innerText;
    const repasse = document.getElementById('totalMedicos').innerText;
    const lucro = document.getElementById('totalLucro').innerText;

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Data do Relatório: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    doc.text(`Faturamento Total: ${bruto}`, 14, 37);
    doc.text(`Total Repasse Médicos: ${repasse}`, 14, 44);
    doc.text(`Lucro Líquido Clínica: ${lucro}`, 14, 51);

    // Gerar a tabela automaticamente a partir do ID da tabela no HTML
    if (window.jspdf.jsPDF.API.autoTable) {
        doc.autoTable({
            html: '#tabelaRelatorioCompleta',
            startY: 60,
            theme: 'grid',
            headStyles: { fillColor: [29, 53, 87] }, // Azul marinho
            styles: { fontSize: 10 }
        });
    }

    // Salva o arquivo com a data atual no nome
    doc.save(`Relatorio_Neurofisio_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
};

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("loaded");
    // Garante que o relatório comece carregando tudo
    window.filtrarRelatorio('todos');
});

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("loaded");
    // Carrega os dados iniciais ao abrir o sistema
    window.filtrarRelatorio('todos');
}); // <--- Essa chave e parênteses fecham o addEventListener