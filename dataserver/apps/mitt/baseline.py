import csv

PmaxTempCoefficient = -0.45
IscTempCoefficient = 0.03
VscTempCoefficient = -0.33
lt200effloss = .03
STC_Power = 230

outfile = open('results.csv', 'w')
writer = csv.writer(outfile)
writer.writerow(['Vo', 'Io', 'Po', 'Irrad', 'PnlTmp', 'Pm', 'Pm0', 'EffPm', 'EffPm0', 'STC Eff', 'Theoretical Eff'])

def run_the_calcs(Vo, Io, Po, irrad, pnltmp):
    temp = ((irrad / 1000) * 2.5)
    temp += pnltmp
    
    temp_scale = temp - 25
    temp_scale *= PmaxTempCoefficient / 100
    temp_scale = 1-temp_scale
    
    power = Po * temp_scale
    
    eff1 = power / irrad
    
    k = lt200effloss * 200/1000
    kfactor = k * (1000-irrad) / (1000-200)
    
    Pm0 = Po / (irrad/1000 * temp_scale - kfactor)
    
    eff2 = Pm0 / irrad
    
    writer.writerow([Vo, Io, Po, irrad, pnltmp, 
                     power, Pm0, eff1, eff2, 
                     STC_Power/irrad, 
                     Pm0/STC_Power*100.0])
    
    print(("-"*80))
    print(("Vo", Vo))
    print(("Io", Io))
    print(("Po", Po))
    print(("Irradiance", irrad))
    print(("Panel Temp", pnltmp))
    print(("Power,Eff1", power, eff1))
    print(("Pm0,Eff2", Pm0, eff2))
    print(("STC Eff (230/irrad)", STC_Power / irrad))
    print(("Percentage Of Theoretical", Pm0 / STC_Power * 100.0))
    
run_the_calcs( 29.4679054054 , 3.47080869932 , 102.274874301 , 401.802 , 23.034 )
run_the_calcs( 28.0065789474 , 3.73581414474 , 104.625879388 , 402.096 , 33.238 )
run_the_calcs( 29.6763980263 , 3.32586348684 , 98.6973619963 , 388.59 , 21.852 )
run_the_calcs( 27.1800986842 , 4.99506578947 , 135.763321726 , 549.608 , 40.732 )
run_the_calcs( 28.2537006579 , 4.81352796053 , 135.996480841 , 553.74 , 33.672 )
run_the_calcs( 28.3412162162 , 4.73194679054 , 134.107350942 , 544.754 , 32.592 )
run_the_calcs( 27.2964527027 , 5.50876266892 , 150.363091546 , 627.324 , 41.18 )
run_the_calcs( 27.5024671053 , 4.74948601974 , 130.617479826 , 520.438 , 39.382 )
run_the_calcs( 26.9569256757 , 5.67293074324 , 152.920205606 , 641.776 , 42.776 )
run_the_calcs( 29.2380756579 , 3.71751644737 , 108.690247385 , 427.304 , 25.86 )
run_the_calcs( 26.9324324324 , 5.58287584459 , 150.357067211 , 624.322 , 42.884 )
run_the_calcs( 26.9569256757 , 5.67293074324 , 152.920205606 , 641.776 , 42.776 )
run_the_calcs( 27.5024671053 , 4.74948601974 , 130.617479826 , 520.438 , 39.382 )
run_the_calcs( 26.9569256757 , 5.67293074324 , 152.920205606 , 641.776 , 42.776 )
run_the_calcs( 28.1613175676 , 4.90540540541 , 138.139727618 , 562.671428571 , 34.4448979592 )

outfile.close()