import {
  View, Text, StyleSheet, ImageBackground,
  Image, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator
} from 'react-native';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function BagDetailScreen({ route, navigation }) {
  const { bag } = route.params;
  const discount = Math.round((1 - bag.price / bag.original_value) * 100);
  const savings = (bag.original_value - bag.price).toFixed(2);
  const [reserving, setReserving] = useState(false);
  const [reserved, setReserved] = useState(false);

  const handleReserve = async () => {
    setReserving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.rpc('reserve_bag', {
        p_bag_id: bag.id,
        p_user_id: user.id,
      });
      if (error) throw error;
      if (data.success) {
        setReserved(true);
        navigation.navigate('Confirmation', {
          pickupCode: data.pickup_code,
          bag: bag,
        });
      } else {
        alert(data.error || 'Could not reserve bag');
      }
    } catch (err) {
      alert('Something went wrong. Please try again.');
      console.log(err);
    }
    setReserving(false);
  };

  return (
    <View style={styles.wrapper}>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero image */}
        <ImageBackground source={{ uri: bag.image }} style={styles.hero}>
          <View style={styles.heroOverlay} />
          <SafeAreaView>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
          </SafeAreaView>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
          <View style={styles.heroBottom}>
            <Image source={{ uri: bag.logo }} style={styles.heroLogo} />
            <View style={styles.heroRestaurantInfo}>
              <Text style={styles.heroRestaurantName}>{bag.restaurant}</Text>
              <Text style={styles.heroArea}>📍 {bag.area}</Text>
            </View>
            <View style={[
              styles.quantityBadge,
              bag.quantity_remaining === 1 && styles.quantityBadgeUrgent
            ]}>
              <Text style={[
                styles.quantityText,
                bag.quantity_remaining === 1 && styles.quantityTextUrgent
              ]}>
                {bag.quantity_remaining === 1 ? '🔥 Last!' : `${bag.quantity_remaining} left`}
              </Text>
            </View>
          </View>
        </ImageBackground>

        {/* Body */}
        <View style={styles.body}>

          {/* Title */}
          <Text style={styles.bagTitle}>{bag.title}</Text>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>
              {bag.category === 'Bakery' ? '🥐' : bag.category === 'Restaurant' ? '🍽️' : '☕'} {bag.category}
            </Text>
          </View>

          {/* Price card */}
          <View style={styles.priceCard}>
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>You pay</Text>
              <Text style={styles.priceValue}>JD {parseFloat(bag.price).toFixed(2)}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Original</Text>
              <Text style={styles.priceOriginal}>JD {parseFloat(bag.original_value).toFixed(2)}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>You save</Text>
              <Text style={styles.priceSavings}>JD {savings}</Text>
            </View>
          </View>

          {/* Pickup */}
          <Text style={styles.sectionTitle}>🕐 Pickup window</Text>
          <View style={styles.pickupCard}>
            <View style={styles.pickupTime}>
              <Text style={styles.pickupLabel}>From</Text>
              <Text style={styles.pickupValue}>{bag.pickup_start}</Text>
            </View>
            <Text style={styles.pickupArrow}>→</Text>
            <View style={styles.pickupTime}>
              <Text style={styles.pickupLabel}>Until</Text>
              <Text style={styles.pickupValue}>{bag.pickup_end}</Text>
            </View>
            <View style={styles.todayBadge}>
              <Text style={styles.todayText}>Today only</Text>
            </View>
          </View>

          {/* About */}
          <Text style={styles.sectionTitle}>🛍️ About this bag</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              A surprise bag from <Text style={styles.aboutBold}>{bag.restaurant}</Text>! Contents vary daily based on what's freshly available at closing time. Quality food that would otherwise go to waste — at a fraction of the price.
            </Text>
          </View>

          {/* Expect */}
          <Text style={styles.sectionTitle}>✅ What to expect</Text>
          <View style={styles.expectGrid}>
            {[
              { icon: '🌿', text: 'Fresh food' },
              { icon: '🎁', text: 'Surprise contents' },
              { icon: '📱', text: 'Show app at pickup' },
              { icon: '♻️', text: 'Fight food waste' },
              { icon: '💚', text: 'Support local' },
              { icon: '🚫', text: 'No refunds' },
            ].map((item, i) => (
              <View key={i} style={styles.expectItem}>
                <Text style={styles.expectIcon}>{item.icon}</Text>
                <Text style={styles.expectText}>{item.text}</Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>

      {/* Footer always at bottom */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerPrice}>JD {parseFloat(bag.price).toFixed(2)}</Text>
          <Text style={styles.footerSave}>Save JD {savings}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.reserveBtn,
            (bag.quantity_remaining === 0 || reserved) && styles.reserveBtnDisabled
          ]}
          onPress={handleReserve}
          disabled={bag.quantity_remaining === 0 || reserved || reserving}
          activeOpacity={0.85}
        >
          {reserving
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.reserveBtnText}>
                {reserved
                  ? '✅ Reserved!'
                  : bag.quantity_remaining === 0
                  ? '😔 Sold Out'
                  : '🛍️ Reserve Bag'}
              </Text>
          }
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F0F7F0',
    flexDirection: 'column',
  },
  scroll: {
    flex: 1,
  },

  // Hero
  hero: { height: 320, justifyContent: 'space-between' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backBtn: {
    margin: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 22, color: '#1B5E20', fontWeight: '700' },
  discountBadge: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  discountText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  heroBottom: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroLogo: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  heroRestaurantInfo: { flex: 1 },
  heroRestaurantName: {
    fontSize: 17, fontWeight: '800', color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroArea: { fontSize: 12, color: '#C8E6C9', marginTop: 2 },
  quantityBadge: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  quantityBadgeUrgent: { backgroundColor: '#FFEBEE' },
  quantityText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  quantityTextUrgent: { color: '#C62828' },

  // Body
  body: { padding: 20, gap: 12 },
  bagTitle: { fontSize: 24, fontWeight: '800', color: '#1B5E20' },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: '#C8E6C9',
    marginBottom: 8,
  },
  categoryPillText: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },

  // Price card
  priceCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E8F5E9',
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    marginBottom: 8,
  },
  priceCol: { flex: 1, alignItems: 'center' },
  priceDivider: { width: 1, height: 40, backgroundColor: '#E8F5E9' },
  priceLabel: { fontSize: 11, color: '#888780', marginBottom: 4 },
  priceValue: { fontSize: 20, fontWeight: '800', color: '#2E7D32' },
  priceOriginal: {
    fontSize: 15, fontWeight: '600', color: '#B4B2A9',
    textDecorationLine: 'line-through',
  },
  priceSavings: { fontSize: 17, fontWeight: '800', color: '#C62828' },

  // Section title
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1B5E20', marginTop: 4 },

  // Pickup card
  pickupCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E8F5E9',
  },
  pickupTime: { flex: 1, alignItems: 'center' },
  pickupLabel: { fontSize: 11, color: '#888780', marginBottom: 4 },
  pickupValue: { fontSize: 20, fontWeight: '800', color: '#1B5E20' },
  pickupArrow: { fontSize: 20, color: '#A5D6A7', paddingHorizontal: 12 },
  todayBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  todayText: { fontSize: 11, color: '#2E7D32', fontWeight: '600' },

  // About
  aboutCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E8F5E9',
  },
  aboutText: { fontSize: 14, color: '#5F5E5A', lineHeight: 22 },
  aboutBold: { fontWeight: '700', color: '#2E7D32' },

  // Expect grid
  expectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  expectItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: '#E8F5E9',
    minWidth: '45%', flex: 1,
  },
  expectIcon: { fontSize: 16 },
  expectText: { fontSize: 13, color: '#2C2C2A', fontWeight: '500' },

  // Footer
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 12,
  },
  footerLabel: { fontSize: 11, color: '#888780' },
  footerPrice: { fontSize: 26, fontWeight: '800', color: '#2E7D32' },
  footerSave: { fontSize: 12, color: '#C62828', fontWeight: '600' },
  reserveBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 28, paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    minWidth: 160, alignItems: 'center',
  },
  reserveBtnDisabled: { backgroundColor: '#B4B2A9', shadowOpacity: 0 },
  reserveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});