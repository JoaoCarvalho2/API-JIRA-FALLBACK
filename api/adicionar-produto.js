export default async function handler(req, res) {
  const { nomeProduto, issueKey } = req.body;

  if (!nomeProduto || !issueKey) {
    return res.status(400).json({ error: "Parâmetros ausentes" });
  }

  const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
  const JIRA_EMAIL = process.env.JIRA_EMAIL;
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
  const customFieldId = "customfield_10878"; // troque pelo seu ID real

  const headers = {
    Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`,
    "Content-Type": "application/json"
  };

  try {
    // 1. Adicionar novo valor ao campo
    const criarOpcao = await fetch(`${JIRA_BASE_URL}/rest/api/3/field/${customFieldId}/option`, {
      method: "POST",
      headers,
      body: JSON.stringify({ value: nomeProduto })
    });

    if (!criarOpcao.ok) {
      const erro = await criarOpcao.json();
      throw new Error(`[JIRA] Erro ao adicionar opção: ${JSON.stringify(erro)}`);
    }

    console.log(`[ADICIONADO] Valor "${nomeProduto}" inserido`);

    // 2. Atualizar a issue com esse valor
    const atualizar = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        fields: {
          [customFieldId]: { value: nomeProduto }
        }
      })
    });

    if (!atualizar.ok) {
      const erro = await atualizar.json();
      throw new Error(`[JIRA] Erro ao atualizar issue: ${JSON.stringify(erro)}`);
    }

    return res.status(200).json({ status: "OK", produto: nomeProduto });

  } catch (err) {
    console.error("[ERRO API]:", err.message);
    return res.status(500).json({ error: "Erro ao processar", detalhes: err.message });
  }
}
