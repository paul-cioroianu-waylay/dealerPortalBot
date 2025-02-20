const config = {
  template: 'WoxChat',
  AIModel: 'gpt-4o',
  DEBUG: true,
  PROD_GATEWAY: "https://api.waylay.io",
  PROD_CONSOLE: "https://console.waylay.io",
  DEV_GATEWAY: "https://api-aws-dev.waylay.io",
  DEV_CONSOLE: "https://console-aws.dev.waylay.io",
  cardData: [
    {
      title: "Fleet status",
      icon: "notifications",
      queries: [
       "Update the status of my fleet"
      ],
      type: 'dashboard'
    },
    {
      title: "Asset maintenance",
      icon: "flowsheet",
      queries: [
        "Which assets need maintenance?", "What are the most recent fault codes?"
      ]
    },
    {
      title: "Proactive alarm management",
      icon: "precision_manufacturing",
      queries: [
        "Show me the most recent proactive alarms", "Which proactive rule templates are available?"
      ]
    },
    {
      title: "Work Orders",
      icon: "flowsheet",
      queries: [
        "Show me the status of ongoing work orders"
      ]
    },
    {
      title: "Spare Part Reservation",
      icon: "flowsheet",
      queries: [
        "Create Spare Part Reservation", "Status of my part reservations"
      ]
    }
  ]
}

