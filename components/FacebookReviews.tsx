'use client';

import { Star, Facebook, Instagram, User } from 'lucide-react';

interface Review {
  id: string;
  platform: 'facebook' | 'instagram';
  reviewer: {
    name: string;
  };
  rating: number;
  content: string;
  date: string;
}

const sampleReviews: Review[] = [
  {
    id: '1',
    platform: 'facebook',
    reviewer: {
      name: 'Sarah Johnson'
    },
    rating: 5,
    content: 'Absolutely love the meal service! The butter chicken was amazing and the portions are perfect. Great value for money! 👨‍🍳✨',
    date: '2023-12-10'
  },
  {
    id: '2',
    platform: 'instagram',
    reviewer: {
      name: 'Mike Chen'
    },
    rating: 5,
    content: 'These meals are a game changer! Fresh ingredients and the taste is incredible. My family looks forward to every delivery! 🥘❤️',
    date: '2023-12-08'
  },
  {
    id: '3',
    platform: 'facebook',
    reviewer: {
      name: 'Emily Roberts'
    },
    rating: 5,
    content: 'Finally found a meal service that delivers restaurant quality food. The lamb curry was to die for! Highly recommend! 🌟',
    date: '2023-12-05'
  },
  {
    id: '4',
    platform: 'instagram',
    reviewer: {
      name: 'David Wong'
    },
    rating: 5,
    content: 'Healthy, delicious, and convenient! Love how each meal is perfectly portioned. The chicken stir-fry is my favorite! 🥢🔥',
    date: '2023-12-01'
  }
];

export default function FacebookReviews() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Read what our customers have to say about their experience with our meal service.
            We&apos;re proud to serve our community with delicious, healthy meals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sampleReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 mr-4">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{review.reviewer.name}</h3>
                      {review.platform === 'facebook' ? (
                        <Facebook className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Instagram className="w-4 h-4 text-pink-600" />
                      )}
                    </div>
                    <div className="flex items-center">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-current text-yellow-400"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{review.content}</p>
                <div className="text-sm text-gray-500">
                  {new Date(review.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Follow us on social media for more reviews and updates!
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Facebook className="w-6 h-6" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-600 hover:text-pink-700 transition-colors"
            >
              <Instagram className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
