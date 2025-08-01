import axios from "axios";

export default async function handler(req, res) {
  const { nomeProduto, issueKey } = req.body;

  if (!nomeProduto || !issueKey) {
    return res.status(400).json({ error: "Parâmetros ausentes" });
  }

  const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
  const JIRA_EMAIL = process.env.JIRA_EMAIL;
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
  const customFieldId = "customfield_12345"; // substitua pelo seu

  const auth = {
    username: JIRA_EMAIL,
    password: JIRA_API_TOKEN
  };

  try {
    // 1. Adiciona o valor ao campo dropdown
    await axios.post(
      `${JIRA_BASE_URL}/rest/api/3/field/${customFieldId}/option`,
      { value: nomeProduto },
      { auth }
    );

    console.log(`[ADICIONADO] Valor "${nomeProduto}" inserido como nova opção`);

    // 2. Atualiza a issue com esse valor
    await axios.put(
      `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}`,
      {
        fields: {
          [customFieldId]: { value: nomeProduto }
        }
      },
      { auth }
    );

    console.log(`[ATUALIZADO] Issue ${issueKey} com o novo valor: ${nomeProduto}`);

    return res.status(200).json({ status: "Valor adicionado e selecionado", produto: nomeProduto });
  } catch (err) {
    console.error("[ERRO]", err.response?.data || err.message);
    return res.status(500).json({ error: "Falha ao adicionar ou atualizar valor no campo dropdown", detalhes: err.response?.data });
  }
}
