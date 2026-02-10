T = 10
for tc in range(1,1+T):
    N = int(input())
    hight = map(int,input().split())
    H = list(map(int,hight))
    
    view_sum = 0 
    
    for i in range(2,N-2): #좌우 두 칸 항상 0이니까
        # if H[i-2]<H[i-1]<H[i] and H[i]>H[i+1]>H[i+2]: 이거 넘 복잡
            compare_view = max(H[i-2], H[i-1], H[i+1], H[i+2])
            
            if H[i] > compare_view:
                view_sum += H[i] - compare_view #누적합시킵니다
        
    print(f"#{tc} {view_sum}")