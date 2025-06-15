import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    // Search coins by query
    const searchResponse = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    )

    if (!searchResponse.ok) {
      throw new Error('Failed to search CoinGecko')
    }

    const searchData = await searchResponse.json()
    
    // Return only coins (not exchanges or other results)
    const coins = searchData.coins || []
    
    // Get more details for top 5 results
    const detailedCoins = await Promise.all(
      coins.slice(0, 5).map(async (coin: any) => {
        try {
          const detailResponse = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coin.id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
            {
              headers: {
                'Accept': 'application/json',
              }
            }
          )
          
          if (!detailResponse.ok) {
            return coin // Return basic info if details fail
          }
          
          const details = await detailResponse.json()
          
          return {
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            thumb: coin.thumb,
            large: coin.large,
            market_cap_rank: details.market_cap_rank,
            current_price: details.market_data?.current_price?.usd,
            price_change_24h: details.market_data?.price_change_percentage_24h,
            twitter_handle: details.links?.twitter_screen_name || null,
            homepage: details.links?.homepage?.[0] || null,
            description: details.description?.en?.split('.')[0] || '' // First sentence only
          }
        } catch (error) {
          console.error(`Error fetching details for ${coin.id}:`, error)
          return coin
        }
      })
    )

    return NextResponse.json({ coins: detailedCoins })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search projects' },
      { status: 500 }
    )
  }
}