import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Card, SegmentedButtons, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

import { theme } from '../styles/theme';
import { getEarnings, selectEarnings } from '../store/deliverySlice';

const { width } = Dimensions.get('window');

const EarningsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const earnings = useSelector(selectEarnings);
  
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [refreshing, setRefreshing] = useState(false);
  const [earningsData, setEarningsData] = useState({
    total: 0,
    deliveries: 0,
    average: 0,
    chart: [],
    transactions: [],
  });

  const periods = [
    { value: 'today', label: 'Hari Ini' },
    { value: 'week', label: 'Minggu Ini' },
    { value: 'month', label: 'Bulan Ini' },
  ];

  useEffect(() => {
    fetchEarnings();
  }, [selectedPeriod]);

  const fetchEarnings = async () => {
    try {
      const response = await dispatch(getEarnings(selectedPeriod)).unwrap();
      setEarningsData(response);
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEarnings();
    setRefreshing(false);
  };

  const renderTransaction = ({ item }) => (
    <Card style={styles.transactionCard}>
      <View style={styles.transactionContent}>
        <View style={styles.transactionLeft}>
          <Text style={styles.transactionTitle}>
            Delivery #{item.orderNumber}
          </Text>
          <Text style={styles.transactionDate}>
            {new Date(item.completedAt).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          <Text style={styles.transactionDetails}>
            {item.restaurantName} → {item.customerName}
          </Text>
        </View>
        <View style={styles.transactionRight}>
          <Text style={styles.transactionAmount}>
            + Rp {item.deliveryFee.toLocaleString()}
          </Text>
          <Text style={styles.transactionStatus}>
            {item.paymentMethod === 'cash' ? 'Tunai' : 'Digital'}
          </Text>
        </View>
      </View>
    </Card>
  );

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(211, 47, 47, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const chartData = {
    labels: earningsData.chart.map(item => item.label),
    datasets: [
      {
        data: earningsData.chart.map(item => item.value),
        color: (opacity = 1) => `rgba(211, 47, 47, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <SegmentedButtons
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            buttons={periods}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Earnings Summary */}
        <View style={styles.summaryContainer}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Total Penghasilan</Text>
            <Text style={styles.summaryAmount}>
              Rp {earningsData.total.toLocaleString()}
            </Text>
          </Card>

          <View style={styles.summaryGrid}>
            <Card style={styles.summaryItemCard}>
              <Text style={styles.summaryItemValue}>
                {earningsData.deliveries}
              </Text>
              <Text style={styles.summaryItemLabel}>Delivery</Text>
            </Card>
            
            <Card style={styles.summaryItemCard}>
              <Text style={styles.summaryItemValue}>
                Rp {earningsData.average.toLocaleString()}
              </Text>
              <Text style={styles.summaryItemLabel}>Rata-rata</Text>
            </Card>
          </View>
        </View>

        {/* Earnings Chart */}
        {earningsData.chart.length > 0 && (
          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>Grafik Penghasilan</Text>
            <LineChart
              data={chartData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card>
        )}

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Icon name="motorcycle" size={24} color={theme.colors.primary} />
                <Text style={styles.statValue}>
                  {earningsData.totalDistance || 0} km
                </Text>
                <Text style={styles.statLabel}>Jarak Tempuh</Text>
              </View>
              
              <View style={styles.statItem}>
                <Icon name="access-time" size={24} color={theme.colors.primary} />
                <Text style={styles.statValue}>
                  {earningsData.totalTime || 0}h
                </Text>
                <Text style={styles.statLabel}>Waktu Online</Text>
              </View>
              
              <View style={styles.statItem}>
                <Icon name="star" size={24} color={theme.colors.warning} />
                <Text style={styles.statValue}>
                  {earningsData.averageRating || 0}
                </Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Transaction History */}
        <View style={styles.transactionsContainer}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>Riwayat Transaksi</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          
          {earningsData.transactions.length > 0 ? (
            <FlatList
              data={earningsData.transactions.slice(0, 5)}
              renderItem={renderTransaction}
              keyExtractor={item => item._id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>Belum ada transaksi</Text>
            </Card>
          )}
        </View>

        {/* Withdrawal Section */}
        <Card style={styles.withdrawalCard}>
          <View style={styles.withdrawalHeader}>
            <Text style={styles.withdrawalTitle}>Penarikan Dana</Text>
            <Text style={styles.withdrawalBalance}>
              Saldo: Rp {earningsData.availableBalance?.toLocaleString() || 0}
            </Text>
          </View>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Withdrawal')}
            style={styles.withdrawalButton}
            disabled={!earningsData.availableBalance || earningsData.availableBalance < 50000}
          >
            Tarik Dana
          </Button>
          <Text style={styles.withdrawalNote}>
            Minimal penarikan Rp 50.000
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  periodSelector: {
    padding: 16,
  },
  segmentedButtons: {
    backgroundColor: '#fff',
  },
  summaryContainer: {
    paddingHorizontal: 16,
  },
  summaryCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItemCard: {
    flex: 0.48,
    padding: 16,
    alignItems: 'center',
  },
  summaryItemValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  summaryItemLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  chart: {
    borderRadius: 8,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsCard: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  transactionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  transactionCard: {
    marginBottom: 8,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  transactionDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  transactionStatus: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  withdrawalCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  withdrawalHeader: {
    marginBottom: 16,
  },
  withdrawalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  withdrawalBalance: {
    fontSize: 16,
    color: theme.colors.primary,
    marginTop: 4,
  },
  withdrawalButton: {
    marginBottom: 8,
  },
  withdrawalNote: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default EarningsScreen;