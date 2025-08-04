export default async function handler(req, res) {
  const { nomeProduto, issueKey } = req.body;

  if (!nomeProduto || !issueKey) {
    return res.status(400).json({ error: "Parâmetros ausentes" });
  }

  const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
  const JIRA_EMAIL = process.env.JIRA_EMAIL;
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
  const customFieldId = "customfield_10878";

  const headers = {
    Authorization:
      "Basic " + Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64"),
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    // 1. Verificar contextId do campo
    const contextRes = await fetch(`${JIRA_BASE_URL}/rest/api/3/field/${customFieldId}/context`, { headers });
    const contextData = await contextRes.json();
    const contextId = contextData?.values?.[0]?.id;

    if (!contextId) {
      throw new Error(`[JIRA] Não foi possível obter contextId para o campo ${customFieldId}`);
    }

    console.log(`[JIRA] contextId encontrado: ${contextId}`);

    // 2. Verificar se o valor já existe
    const opcoesRes = await fetch(`${JIRA_BASE_URL}/rest/api/3/field/${customFieldId}/context/${contextId}/option`, { headers });
    const opcoesData = await opcoesRes.json();

    const existente = opcoesData?.values?.find(opt => opt.value.toLowerCase() === nomeProduto.toLowerCase());
    if (existente) {
      console.log(`[JIRA] Valor "${nomeProduto}" já existe com id ${existente.id}`);
    } else {
      // 3. Criar nova opção
      const criarRes = await fetch(
        `${JIRA_BASE_URL}/rest/api/3/field/${customFieldId}/context/${contextId}/option`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ options: [{ value: nomeProduto }] }),
        }
      );

      if (!criarRes.ok) {
        const erroCriacao = await criarRes.json();
        throw new Error(`[JIRA] Erro ao adicionar nova opção: ${JSON.stringify(erroCriacao)}`);
      }

      console.log(`[JIRA] Valor "${nomeProduto}" adicionado com sucesso`);
    }

    // 4. Atualizar a issue com esse valor
    const updateRes = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        fields: {
          [customFieldId]: { value: nomeProduto },
        },
      }),
    });

    if (!updateRes.ok) {
      const erroUpdate = await updateRes.json();
      throw new Error(`[JIRA] Erro ao atualizar issue: ${JSON.stringify(erroUpdate)}`);
    }

    console.log(`[JIRA] Issue ${issueKey} atualizada com o produto "${nomeProduto}"`);

    return res.status(200).json({ status: "OK", produto: nomeProduto });

  } catch (err) {
    console.error("[ERRO API]:", err.message);
    return res.status(500).json({ error: "Erro ao processar", detalhes: err.message });
  }
}
