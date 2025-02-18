class Dashboard {
  client = null
  selectedResources = []
  map = null
  assetsPerTypePieChart = null
  assetsPerAccountPieChart = null


  setClient(client) {
    this.client = client
  }

  getSelectedResources() {
    return this.selectedResources
  }

  async drawOnCanvas() {
    const canvasDiv = document.getElementById('canvas')
    canvasDiv.style.transition = 'none'
    canvasDiv.style.opacity = '0'

    let response = await this.client.resources.search({ tags: 'DealerPortal' })
    let resources = response.values

    // Recreate table and map
    this.createResourceTable(resources)
    this.createMap(resources)
    this.createPieCharts(resources)

    // Restore transition and fade-in smoothly after a small delay
    setTimeout(() => {
      canvasDiv.style.transition = 'opacity 0.5s ease-in-out'  // Restore transition
      canvasDiv.style.opacity = '1'  // Smooth fade-in
    }, 50) // Short delay to prevent flash effect
  }

  createResourceTable(resources) {
    const upperLeftCanvas = document.getElementById('upperLeftCanvas')
    upperLeftCanvas.className = 'upperLeftCanvas markdown-body'
    upperLeftCanvas.style.backgroundColor = 'inherit'

    // Remove existing table if it exists
    const existingTable = upperLeftCanvas.querySelector('table')
    if (existingTable) {
      upperLeftCanvas.removeChild(existingTable)
    }

    // Create table
    const table = document.createElement('table')
    table.style.borderCollapse = 'collapse'

    // Create header row
    const headerRow = document.createElement('tr')
    const headers = ['ID', 'Name', 'Product', 'Account', 'AI Health Score', 'Selected']

    headers.forEach(headerText => {
      const th = document.createElement('th')
      th.textContent = headerText
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
        row.appendChild(td)
      })

      // Create 'Selected' column with checkbox
      const checkboxTd = document.createElement('td')
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkboxTd.style.textAlign = 'center'
      checkboxTd.style.verticalAlign = 'middle'
      checkbox.dataset.id = resource.id

      checkbox.addEventListener('change', (event) => {
        this.updateSelectedResources(event.target.dataset.id, event.target.checked)
      })

      checkboxTd.appendChild(checkbox)
      row.appendChild(checkboxTd)

      // Append row to the table
      table.appendChild(row)
    })

    // Append the table to the upperLeftCanvas element
    upperLeftCanvas.appendChild(table)
  }

  updateSelectedResources(id, isSelected) {
    if (isSelected) {
      if (!this.selectedResources.includes(id)) {
        this.selectedResources.push(id)
      }
    } else {
      this.selectedResources = this.selectedResources.filter(resId => resId !== id)
    }
    console.log('Selected Resources:', this.selectedResources)
  }

  createMap(resources) {
    const resMapDiv = document.getElementById('resMap')
    if (!resMapDiv) {
      console.error('resMap not found.')
      return
    }

    if (!this.map) {
      // Create map only if it doesn't exist
      this.map = L.map('resMap').setView([resources[0].latitude, resources[0].longitude], 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map)
    } else {
      // If the map exists, just update the view
      this.map.setView([resources[0].latitude, resources[0].longitude], 12)
    }

    // Clear existing markers before adding new ones
    this.map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer)
      }
    })

    // Add new markers
    resources.forEach(resource => {
      L.marker([resource.latitude, resource.longitude])
        .addTo(this.map)
        .bindPopup('ID: ' + resource.id)
        .openPopup()
    })

    console.log('Map updated with new markers.')
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

    let options = {
      chart: {
        type: 'pie',
        height: '100%',
        width: '100%',
      },
      title: {
        text: 'Pie Chart',
        align: 'center',
        style: {
          color: 'var(--color-fg-default)',
        },
      },
      legend: { show: false },
    }

    this.createAssetsPerTypePieChart(perType, options)
    this.createAssetsPerAccountPieChart(perAccount, options)
  }

  createAssetsPerTypePieChart(perType, options) {
    options.title.text = 'Assets per type'
    options.series = Object.values(perType)
    options.labels = Object.keys(perType)

    const chartElement = document.getElementById('leftPieChart')

    if (this.assetsPerTypePieChart) {
      //  If chart exists, update it instead of recreating
      this.assetsPerTypePieChart.updateOptions({
        series: options.series,
        labels: options.labels,
      })
    } else {
      //  Create a new chart if it doesn't exist
      this.assetsPerTypePieChart = new ApexCharts(chartElement, options)
      this.assetsPerTypePieChart.render()
    }
  }

  createAssetsPerAccountPieChart(perAccount, options) {
    options.title.text = 'Assets per Account'
    options.series = Object.values(perAccount)
    options.labels = Object.keys(perAccount)

    let chartElement = document.getElementById('rightPieChart')

    if (this.assetsPerAccountPieChart) {
      //  If chart exists, update it instead of recreating
      this.assetsPerAccountPieChart.updateOptions({
        series: options.series,
        labels: options.labels,
      })
    } else {
      //  Create a new chart if it doesn't exist
      this.assetsPerAccountPieChart = new ApexCharts(chartElement, options)
      this.assetsPerAccountPieChart.render()
    }
  }


}
