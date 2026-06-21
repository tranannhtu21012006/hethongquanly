import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { DollarSign, TrendingUp, CreditCard, RefreshCcw } from 'lucide-react';
import { format, parseISO, startOfDay, eachDayOfInterval, subDays } from 'date-fns';
import { Package, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

export const Dashboard = () => {
  const { transactions, products, currency, toggleCurrency, config } = useAppStore();
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [dateRange, setDateRange] = useState(7); // default 7 days

  const displayPrice = (priceVnd: number) => {
    if (currency === 'JPY') {
      return `¥${Math.round(priceVnd / config.exchangeRate).toLocaleString()}`;
    }
    return `${priceVnd.toLocaleString()} đ`;
  };

  const { totalRevenue, totalCost, profit, topProducts } = useMemo(() => {
    let rev = 0;
    let cost = 0;
    const productSales: Record<string, { name: string, qty: number, rev: number }> = {};

    transactions.forEach(tx => {
      if (tx.type === 'OUT') {
        rev += tx.total;
        
        // Track for top products
        if (!productSales[tx.productId]) {
          const product = products.find(p => p.id === tx.productId);
          productSales[tx.productId] = { name: product?.name || 'Sản phẩm đã xóa', qty: 0, rev: 0 };
        }
        productSales[tx.productId].qty += tx.quantity;
        productSales[tx.productId].rev += tx.total;

      } else if (tx.type === 'IN') {
        cost += tx.total;
      }
    });

    const top = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    return { totalRevenue: rev, totalCost: cost, profit: rev - cost, topProducts: top };
  }, [transactions, products]);

  const inventoryStats = useMemo(() => {
    let todayIn = 0, todayOut = 0;
    let last7In = 0, last7Out = 0;
    let last30In = 0, last30Out = 0;

    const now = new Date();
    const startOfTodayDt = startOfDay(now);
    const startOf7Days = subDays(startOfTodayDt, 7);
    const startOf30Days = subDays(startOfTodayDt, 30);

    transactions.forEach(tx => {
      const txDate = parseISO(tx.date);
      if (txDate >= startOfTodayDt) {
        if (tx.type === 'IN') todayIn += tx.quantity;
        else todayOut += tx.quantity;
      }
      
      if (txDate >= startOf7Days) {
        if (tx.type === 'IN') last7In += tx.quantity;
        else last7Out += tx.quantity;
      }

      if (txDate >= startOf30Days) {
        if (tx.type === 'IN') last30In += tx.quantity;
        else last30Out += tx.quantity;
      }
    });

    const currentStock = products.reduce((total, p) => 
      total + p.variants.reduce((vTotal, v) => vTotal + v.stock, 0)
    , 0);

    return { todayIn, todayOut, last7In, last7Out, last30In, last30Out, currentStock };
  }, [transactions, products]);

  // Chart data
  const chartData = useMemo(() => {
    const end = startOfDay(new Date());
    const start = subDays(end, dateRange - 1);
    const days = eachDayOfInterval({ start, end });

    const dataMap: Record<string, { date: string, rev: number, cost: number, qty: number }> = {};
    days.forEach(d => {
      dataMap[format(d, 'yyyy-MM-dd')] = { date: format(d, 'dd/MM'), rev: 0, cost: 0, qty: 0 };
    });

    transactions.forEach(tx => {
      const txDate = format(parseISO(tx.date), 'yyyy-MM-dd');
      if (dataMap[txDate]) {
        if (tx.type === 'OUT') {
          dataMap[txDate].rev += (currency === 'JPY' ? tx.total / config.exchangeRate : tx.total);
          dataMap[txDate].qty += tx.quantity;
        } else {
          dataMap[txDate].cost += (currency === 'JPY' ? tx.total / config.exchangeRate : tx.total);
        }
      }
    });

    return Object.values(dataMap);
  }, [transactions, dateRange, currency, config.exchangeRate]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Tổng quan Thống kê</h2>
        <Button onClick={toggleCurrency} variant="outline" className="font-semibold text-primary">
          <RefreshCcw className="mr-2 h-4 w-4" />
          {currency === 'VND' ? 'Hiển thị: VNĐ' : 'Hiển thị: Yên (JPY)'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{displayPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Tổng tiền thu từ xuất hàng</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Chi phí</CardTitle>
            <CreditCard className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{displayPrice(totalCost)}</div>
            <p className="text-xs text-muted-foreground">Tổng tiền chi cho nhập hàng</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lợi nhuận</CardTitle>
            <TrendingUp className={`h-4 w-4 ${profit >= 0 ? 'text-green-600' : 'text-destructive'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {displayPrice(profit)}
            </div>
            <p className="text-xs text-muted-foreground">Doanh thu - Chi phí</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
              <Package className="h-4 w-4" /> Hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Nhập</p>
              <p className="font-bold text-lg text-green-600">+{inventoryStats.todayIn}</p>
            </div>
            <div className="border-x border-primary/10">
              <p className="text-xs text-muted-foreground mb-1">Xuất</p>
              <p className="font-bold text-lg text-primary">-{inventoryStats.todayOut}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Đang tồn</p>
              <p className="font-bold text-lg">{inventoryStats.currentStock}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              7 ngày qua
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex justify-center items-center gap-1"><ArrowDownToLine className="h-3 w-3" /> Tổng Nhập</p>
              <p className="font-bold text-lg text-green-600">{inventoryStats.last7In}</p>
            </div>
            <div className="border-l">
              <p className="text-xs text-muted-foreground mb-1 flex justify-center items-center gap-1"><ArrowUpFromLine className="h-3 w-3" /> Tổng Xuất</p>
              <p className="font-bold text-lg text-primary">{inventoryStats.last7Out}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              30 ngày qua
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex justify-center items-center gap-1"><ArrowDownToLine className="h-3 w-3" /> Tổng Nhập</p>
              <p className="font-bold text-lg text-green-600">{inventoryStats.last30In}</p>
            </div>
            <div className="border-l">
              <p className="text-xs text-muted-foreground mb-1 flex justify-center items-center gap-1"><ArrowUpFromLine className="h-3 w-3" /> Tổng Xuất</p>
              <p className="font-bold text-lg text-primary">{inventoryStats.last30Out}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-7 lg:col-span-4">
          <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0">
            <CardTitle>Biểu đồ Doanh thu & Chi phí</CardTitle>
            <div className="flex gap-2">
              <select 
                className="text-sm border rounded p-1"
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
              >
                <option value={7}>7 ngày qua</option>
                <option value={14}>14 ngày qua</option>
                <option value={30}>30 ngày qua</option>
              </select>
              <select 
                className="text-sm border rounded p-1"
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'bar' | 'line')}
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip formatter={(value: any) => displayPrice(currency === 'VND' ? value : value * config.exchangeRate)} />
                  <Legend />
                  <Bar dataKey="rev" name="Doanh thu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" name="Chi phí" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip formatter={(value: any) => displayPrice(currency === 'VND' ? value : value * config.exchangeRate)} />
                  <Legend />
                  <Line type="monotone" dataKey="rev" name="Doanh thu" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="cost" name="Chi phí" stroke="hsl(var(--destructive))" strokeWidth={2} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-7 lg:col-span-4">
          <CardHeader>
            <CardTitle>Số lượng Sản phẩm bán ra</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip formatter={(value: any) => `${value} sản phẩm`} />
                <Legend />
                <Line type="monotone" dataKey="qty" name="Số lượng bán" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-7 lg:col-span-3">
          <CardHeader>
            <CardTitle>Top 10 Sản phẩm Bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">Chưa có dữ liệu bán hàng.</div>
              ) : (
                topProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold mr-3">
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none line-clamp-1">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.qty} sản phẩm</p>
                    </div>
                    <div className="font-medium text-sm text-right">
                      {displayPrice(p.rev)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
