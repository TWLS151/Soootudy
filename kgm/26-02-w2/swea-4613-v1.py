T = int(input())

for tc in range(1,1+T):
    N, M = map(int, input().split())
    color = [list(input()) for i in range(N)]
    
    w_list=[]
    b_list=[]
    r_list=[]

    for i in range(N):
        w_list.append(color[i].count('W'))
        b_list.append(color[i].count('B'))
        r_list.append(color[i].count('R'))
    
    result=[]

    for i in range(0,N-2):
        for z in range(i+1,N-1):
            temp = 0
            for white in range(0,i+1):
                temp += M - w_list[white]    
            for blue in range(i+1,z+1):
                temp += M - b_list[blue]
            for red in range(z+1, N):
                temp += M - r_list[red]
        # result.append(temp) 이부분이 for문 바깥에 있어서 문제가 발생했음
            result.append(temp)
        
    num = min(result)
    print(f'#{tc} {num}')