T = int(input())

for test_case in range(1, T+1):
    N = int(input())    
    carrot = list(map(int, input().split()))
    carrot.sort()
    carrot_cnt={}
    for i in carrot:
        if i in carrot_cnt.keys():
            carrot_cnt[i] += 1
        else:
            carrot_cnt[i] = 1
    carrot_lit=[]
    
    for cnt in carrot_cnt.values():
        carrot_lit.append(cnt)
    length = len(carrot_lit)
    result = []

    
 
    for i in range(1,length-1):
        for z in range(i+1,length):
 
            # print(sum(carrot_lit[0:i]))
            # print(sum(carrot_lit[i:z]))
            # print(sum(carrot_lit[z:]))
            if sum(carrot_lit[0:i]) >N/2 or sum(carrot_lit[i:z]) > N/2 or sum(carrot_lit[z:]) >N/2:
                pass

            else:
                max_num = max(sum(carrot_lit[0:i]),sum(carrot_lit[i:z]),sum(carrot_lit[z:]))
                min_num = min(sum(carrot_lit[0:i]),sum(carrot_lit[i:z]),sum(carrot_lit[z:]))
                result.append(max_num-min_num)

    if len(result) == 0:
        print(f'#{test_case} -1')
    else:
        print(f'#{test_case} {min(result)}')