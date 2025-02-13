class Dashboard {
  constructor(client) {
    this.client = client
  }

  async getResources() {
    let response = await this.client.resources.search({ tags: 'DealerPortal' })
    console.log(response)
    return response.values
  }


  async drawOnCanvas() {
    let response = await this.client.resources.search({ tags: 'DealerPortal' })
    let resources = response.values
    this.createResourceTable(resources)
    this.createMap(resources)
    this.createPieCharts(resources)

  }

  createResourceTable(resources) {
    const upperLeftCanvas = document.getElementById('upperLeftCanvas')
    upperLeftCanvas.className = 'upperLeftCanvas markdown-body'
    upperLeftCanvas.style.backgroundColor = 'inherit'
    // Create a table element
    const table = document.createElement('table')
    table.style.borderCollapse = 'collapse'

    // Create table header row
    const headerRow = document.createElement('tr')
    const headers = ['ID', 'Name', 'Product', 'Account', 'AI Health Score']

    headers.forEach(headerText => {
      const th = document.createElement('th')
      th.textContent = headerText
      table.appendChild(th)
      headerRow.appendChild(th)
    })

    // Append header row to the table
    table.appendChild(headerRow)

    // Populate table rows with resource data
    resources.forEach(resource => {
      const row = document.createElement('tr')

      // Create and append each table cell
      const properties = ['id', 'name', 'resourceTypeId', 'Account', 'AI Health Score']
      properties.forEach(prop => {
        const td = document.createElement('td')
        td.textContent = resource[prop] || 'N/A'
        // td.style.border = '1px solid #ccc'
        //   td.style.padding = '8px'
        row.appendChild(td)
      })

      // Append row to the table
      table.appendChild(row)
    })

    // Append the table to the upperLeftCanvas element
    upperLeftCanvas.appendChild(table)
  }

  createMap(resources) {
    const resMapDiv = document.getElementById('resMap')

    var map = L.map('resMap').setView([resources[0].latitude, resources[0].longitude], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

    // Add markers to the map
    resources.forEach(function(resource) {
      L.marker([resource.latitude, resource.longitude])
        .addTo(map)
        .bindPopup('ID: ' + resource.id)
        .openPopup()
    })
  }

  createPieCharts(resources) {
    const perType = {}
    const perAccount = {}
    console.log('createPieCharts', resources)
    resources.forEach(item => {
      if (item.resourceTypeId in perType) {
        perType[item.resourceTypeId]++
      } else {
        perType[item.resourceTypeId] = 1
      }
      if (item.Account in perAccount) {
        perAccount[item.Account]++
      } else {
        perAccount[item.Account] = 1
      }

    })
    this.createAssetsPerTypePieChart(perType)
    this.createAssetsPerAccountPieChart(perAccount)
  }

  createAssetsPerTypePieChart(perType) {
    let options = {
      chart: {
        type: 'pie',
        height: '100%',
        width: '100%'
      },
      title: {
        text: 'Assets per type',
        align: 'center',
      },
      legend: { show: false },
      series: Object.values(perType),
      labels: Object.keys(perType),
    }
    var chart = new ApexCharts(document.getElementById('leftPieChart'), options)
    chart.render()
  }
  createAssetsPerAccountPieChart(perAccount) {
    let options = {
      chart: {
        type: 'pie',
        height: '100%',
        width: '100%'
      },
      title: {
        text: 'Assets per Account',
        align: 'center',
      },
      legend: { show: false },
      series: Object.values(perAccount),
      labels: Object.keys(perAccount),
    }
    var chart = new ApexCharts(document.getElementById('rightPieChart'), options)
    chart.render()
  }



}
