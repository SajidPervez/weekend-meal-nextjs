import { NextResponse } from 'next/server';

export async function GET() {
  const pageId = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

  console.log('Server-side Facebook API Config:', {
    pageId,
    hasAccessToken: !!accessToken
  });

  if (!pageId || !accessToken) {
    const missingVars = [];
    if (!pageId) missingVars.push('NEXT_PUBLIC_FACEBOOK_PAGE_ID');
    if (!accessToken) missingVars.push('FACEBOOK_ACCESS_TOKEN');
    
    return NextResponse.json({ 
      error: `Missing environment variables: ${missingVars.join(', ')}` 
    }, { status: 500 });
  }

  try {
    // First try to get the list of pages you manage
    console.log('Fetching managed pages...');
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();

    console.log('Pages response:', pagesData);

    if (pagesResponse.ok && pagesData.data) {
      const pages = pagesData.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        access_token: page.access_token
      }));
      
      console.log('Available pages:', pages.map((p: any) => ({ id: p.id, name: p.name })));
      
      // Try to find our page
      const targetPage = pages.find((p: any) => p.id === pageId);
      if (targetPage) {
        console.log('Found target page:', targetPage.name);
        
        // Use the page-specific access token
        const url = `https://graph.facebook.com/v19.0/${pageId}/ratings?fields=review_text,rating,created_time,reviewer&access_token=${targetPage.access_token}`;
        
        console.log('Fetching reviews...');
        const response = await fetch(url);
        const responseData = await response.json();

        if (!response.ok) {
          console.error('Facebook API Error:', responseData);
          return NextResponse.json({ 
            error: `Failed to fetch Facebook reviews: ${responseData.error?.message || JSON.stringify(responseData)}`,
            availablePages: pages.map((p: any) => ({ id: p.id, name: p.name }))
          }, { status: 500 });
        }

        if (!responseData.data) {
          console.log('No reviews found in response');
          return NextResponse.json({ data: [] });
        }

        const reviews = responseData.data.map((review: any) => ({
          id: review.id || Math.random().toString(),
          reviewer: {
            name: review.reviewer?.name || 'Anonymous',
            id: review.reviewer?.id || '0'
          },
          rating: review.rating || 5,
          content: review.review_text || '',
          date: review.created_time
        }));

        console.log(`Successfully fetched ${reviews.length} reviews`);
        return NextResponse.json({ data: reviews });
      } else {
        console.log('Target page not found among available pages');
        return NextResponse.json({ 
          error: 'Page ID not found in your managed pages',
          availablePages: pages.map((p: any) => ({ id: p.id, name: p.name }))
        }, { status: 404 });
      }
    } else {
      console.error('Failed to fetch pages:', pagesData);
      return NextResponse.json({ 
        error: `Failed to fetch pages: ${pagesData.error?.message || JSON.stringify(pagesData)}` 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in Facebook API route:', error);
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
}
