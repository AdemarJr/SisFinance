# 📡 API de Integração Financeira - PyrouStock

## Visão Geral

A API de Integração permite que sistemas financeiros externos consumam dados do PyrouStock de forma segura e estruturada.

**Base URL:** `https://{PROJECT_ID}.supabase.co/functions/v1/make-server-8a20b27d/integration`

---

## 🔐 Autenticação

Todas as requisições devem incluir uma **API Key** no header:

```http
Authorization: Bearer pyroustock_integration_xxxxxxxxxxxxx
```

### Como Gerar uma API Key

1. Acesse **PyrouStock** → **Integrações** (menu lateral)
2. Clique em **"Gerar Nova Chave de API"**
3. Preencha:
   - **Nome**: Identificação do sistema (ex: "Sistema Financeiro XYZ")
   - **Permissões**: Selecione as permissões necessárias
4. Clique em **"Gerar Chave"**
5. **IMPORTANTE**: Copie e guarde a chave imediatamente - ela não será exibida novamente

### Permissões Disponíveis

- `read_sales` - Permite consultar vendas e receitas
- `read_cashier` - Permite consultar fechamentos de caixa
- `read_products` - Permite consultar catálogo de produtos

---

## 📊 Endpoints

### 1. **Exportação Consolidada** (Recomendado)

Retorna todos os dados financeiros em uma única requisição.

```http
GET /integration/financial-export
```

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `companyId` | string | Não* | ID da empresa (se não especificado, usa o da API Key) |
| `startDate` | string | Não | Data inicial (ISO 8601) Ex: `2024-03-01T00:00:00Z` |
| `endDate` | string | Não | Data final (ISO 8601) Ex: `2024-03-31T23:59:59Z` |

*Se a API Key estiver vinculada a uma empresa específica, o `companyId` é opcional.

#### Exemplo de Requisição

```bash
curl -X GET \
  'https://xxxxx.supabase.co/functions/v1/make-server-8a20b27d/integration/financial-export?startDate=2024-03-01T00:00:00Z&endDate=2024-03-31T23:59:59Z' \
  -H 'Authorization: Bearer pyroustock_integration_xxxxxxxxxxxxx'
```

#### Exemplo de Resposta

```json
{
  "success": true,
  "companyId": "07800941-938b-4d09-9d74-2742eb4f04d6",
  "exportDate": "2024-03-16T14:30:00Z",
  "period": {
    "startDate": "2024-03-01T00:00:00Z",
    "endDate": "2024-03-31T23:59:59Z"
  },
  "summary": {
    "totalSales": 15420.50,
    "totalCost": 8230.00,
    "totalProfit": 7190.50,
    "profitMargin": 46.62,
    "inventoryValue": 32450.00,
    "salesCount": 127,
    "cashierClosuresCount": 15,
    "productsCount": 85
  },
  "sales": [
    {
      "id": "sale-uuid",
      "companyId": "company-uuid",
      "date": "2024-03-15T18:30:00Z",
      "total": 250.00,
      "paymentMethod": "pix",
      "items": [
        {
          "productId": "product-uuid",
          "productName": "Cerveja Heineken 600ml",
          "quantity": 5,
          "unitPrice": 10.00,
          "totalPrice": 50.00,
          "costPrice": 6.50,
          "profit": 17.50
        }
      ],
      "totalCost": 150.00,
      "totalProfit": 100.00,
      "profitMargin": 40.00,
      "userId": "user-uuid",
      "userName": "João Silva",
      "cashierId": "register-uuid",
      "receiptNumber": "001234"
    }
  ],
  "cashierClosures": [
    {
      "id": "closure-uuid",
      "companyId": "company-uuid",
      "openDate": "2024-03-15T08:00:00Z",
      "closeDate": "2024-03-15T20:00:00Z",
      "duration": "12h 0m",
      "openingBalance": 200.00,
      "closingBalance": 1450.00,
      "totalSales": 1250.00,
      "totalExpected": 1450.00,
      "totalCounted": 1450.00,
      "difference": 0.00,
      "paymentBreakdown": {
        "money": 450.00,
        "pix": 600.00,
        "credit": 150.00,
        "debit": 50.00
      },
      "withdrawals": [],
      "reinforcements": []
    }
  ],
  "inventory": [
    {
      "id": "product-uuid",
      "companyId": "company-uuid",
      "name": "Cerveja Heineken 600ml",
      "category": "bebida",
      "measurementUnit": "un",
      "currentStock": 50,
      "minStock": 20,
      "safetyStock": 30,
      "averageCost": 6.50,
      "sellingPrice": 10.00,
      "profitMargin": 35.00,
      "stockValue": 325.00,
      "potentialRevenue": 500.00,
      "potentialProfit": 175.00
    }
  ]
}
```

---

### 2. **Vendas Individuais**

```http
GET /integration/sales
```

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `companyId` | string | Não* | ID da empresa |
| `startDate` | string | Não | Data inicial (ISO 8601) |
| `endDate` | string | Não | Data final (ISO 8601) |
| `limit` | number | Não | Número de resultados (padrão: 100) |
| `offset` | number | Não | Offset para paginação (padrão: 0) |

#### Resposta

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 127,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 3. **Fechamentos de Caixa**

```http
GET /integration/cashier-closures
```

Mesmos parâmetros de `/integration/sales`.

---

### 4. **Catálogo de Produtos**

```http
GET /integration/products
```

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `companyId` | string | Não* | ID da empresa |
| `category` | string | Não | Filtrar por categoria (alimento, bebida, etc) |
| `limit` | number | Não | Número de resultados (padrão: 100) |
| `offset` | number | Não | Offset para paginação (padrão: 0) |

---

## 🔄 Estratégias de Integração

### Opção 1: Sincronização Batch (Recomendado)

Execute uma vez por dia (ex: 00:00) para importar todos os dados do dia anterior:

```bash
# Exemplo: Importar dados de ontem
START_DATE=$(date -d "yesterday" +"%Y-%m-%dT00:00:00Z")
END_DATE=$(date -d "yesterday" +"%Y-%m-%dT23:59:59Z")

curl -X GET \
  "https://xxxxx.supabase.co/functions/v1/make-server-8a20b27d/integration/financial-export?startDate=$START_DATE&endDate=$END_DATE" \
  -H "Authorization: Bearer $API_KEY"
```

### Opção 2: Sincronização em Tempo Real

Use webhooks (recurso futuro) ou polling a cada 5-15 minutos.

### Opção 3: Sob Demanda

Botão no sistema financeiro que chama a API quando necessário.

---

## 📈 Mapeamento de Dados Financeiros

### Contas Contábeis Sugeridas

| Dado PyrouStock | Conta Contábil | Tipo |
|-----------------|----------------|------|
| `summary.totalSales` | 3.1.01 - Receita de Vendas | Receita |
| `summary.totalCost` | 1.1.05 - CMV (Custo de Mercadoria Vendida) | Despesa |
| `summary.totalProfit` | 3.3.01 - Lucro Bruto | Resultado |
| `summary.inventoryValue` | 1.1.03 - Estoque | Ativo Circulante |
| `cashierClosures[].totalSales` | 1.1.01 - Caixa | Ativo Circulante |

### Lançamentos Contábeis Sugeridos

#### Venda à Vista (Dinheiro/PIX)

```
D - 1.1.01 - Caixa              R$ 250,00
C - 3.1.01 - Receita de Vendas  R$ 250,00

D - 1.1.05 - CMV                R$ 150,00
C - 1.1.03 - Estoque            R$ 150,00
```

#### Venda no Cartão de Crédito

```
D - 1.1.02 - Contas a Receber   R$ 250,00
C - 3.1.01 - Receita de Vendas  R$ 250,00

D - 1.1.05 - CMV                R$ 150,00
C - 1.1.03 - Estoque            R$ 150,00
```

---

## 🛡️ Segurança

### Boas Práticas

1. **Nunca compartilhe sua API Key** em repositórios públicos
2. **Use variáveis de ambiente** para armazenar a chave
3. **Revogue chaves comprometidas** imediatamente
4. **Monitore o uso** através da data de `lastUsedAt`
5. **Use HTTPS** sempre (obrigatório)

### Rate Limiting

- **100 requisições/minuto** por API Key
- Retorna `429 Too Many Requests` se excedido

---

## ❌ Códigos de Erro

| Código | Descrição | Solução |
|--------|-----------|---------|
| `400` | Requisição inválida | Verifique os parâmetros |
| `401` | API Key inválida | Verifique o header Authorization |
| `403` | Permissão negada | API Key sem permissão necessária |
| `404` | Recurso não encontrado | Verifique o endpoint |
| `429` | Rate limit excedido | Aguarde 1 minuto |
| `500` | Erro interno | Tente novamente ou contate suporte |

---

## 📞 Suporte

- **Documentação**: [GitHub Wiki](#)
- **Issues**: [GitHub Issues](#)
- **Email**: suporte@pyroustock.com

---

## 📝 Changelog

### v1.0.0 - 2024-03-16

- ✅ Endpoint consolidado `/financial-export`
- ✅ Endpoints individuais de vendas, caixa e produtos
- ✅ Sistema de API Keys com permissões granulares
- ✅ Paginação e filtros por data
- ✅ Métricas de resumo financeiro

---

**Made with ❤️ by PyrouStock Team**
